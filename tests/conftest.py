import inspect
import json
import os
import random
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Generator
from unittest.mock import Mock, patch

import mysql.connector
import pytest
import requests
from dotenv import find_dotenv, load_dotenv
from pytest_docker.plugin import get_docker_services
from sqlalchemy import event, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine
from starlette_context import context, request_cycle_context

# This import is required to create the tables
from techhala.api.core.dependencies import SINGLE_TENANT_UUID
from techhala.api.core.elastic import ElasticClient
from techhala.api.models.db.alert import *
from techhala.api.models.db.provider import *
from techhala.api.models.db.rule import *
from techhala.api.models.db.tenant import *
from techhala.api.models.db.user import *
from techhala.api.models.db.workflow import *
from techhala.api.tasks.process_event_task import process_event
from techhala.api.utils.enrichment_helpers import convert_db_alerts_to_dto_alerts
from techhala.contextmanager.contextmanager import ContextManager

original_request = requests.Session.request  # noqa
load_dotenv(find_dotenv())


class PusherMock:

    def __init__(self):
        self.triggers = []

    def trigger(self, channel, event_name, data):
        self.triggers.append((channel, event_name, data))


class WorkflowManagerMock:

    def __init__(self):
        self.events = []

    def get_instance(self):
        return self

    def insert_incident(self, tenant_id, incident_dto, action):
        self.events.append((tenant_id, incident_dto, action))


class ElasticClientMock:

    def __init__(self):
        self.alerts = []
        self.tenant_id = None
        self.enabled = True

    def __call__(self, tenant_id):
        self.tenant_id = tenant_id
        return self

    def index_alerts(self, alerts):
        self.alerts.append((self.tenant_id, alerts))


@pytest.fixture
def ctx_store() -> dict:
    """
    Create a context store
    """
    return {"X-Request-ID": random.randint(10000, 90000)}


@pytest.fixture(autouse=True)
def mocked_context(ctx_store) -> None:
    with request_cycle_context(ctx_store):
        yield context


@pytest.fixture
def context_manager():
    os.environ["STORAGE_MANAGER_DIRECTORY"] = "/tmp/storage-manager"
    return ContextManager(tenant_id=SINGLE_TENANT_UUID, workflow_id="1234")


@pytest.fixture(scope="session")
def docker_services(
    docker_compose_command,
    docker_compose_file,
    docker_compose_project_name,
    docker_setup,
    docker_cleanup,
):
    """Start the MySQL service (or any other service from docker-compose.yml)."""

    # If we are running in Github Actions, we don't need to start the docker services
    # as they are already handled by the Github Actions
    if os.getenv("GITHUB_ACTIONS") == "true":
        print("Running in Github Actions, skipping docker services")
        yield
        return

    # For local development, you can avoid spinning up the mysql container every time:
    if os.getenv("SKIP_DOCKER"):
        yield
        return

    # Else, start the docker services
    try:
        stack = inspect.stack()
        # this is a hack to support more than one docker-compose file
        for frame in stack:
            # if its a db_session, then we need to use the mysql docker-compose file
            if frame.function == "db_session":
                docker_compose_file = docker_compose_file.replace(
                    "docker-compose.yml", "docker-compose-mysql.yml"
                )
                break
            # if its a elastic_client, then we need to use the elastic docker-compose file
            elif frame.function == "elastic_client":
                docker_compose_file = docker_compose_file.replace(
                    "docker-compose.yml", "docker-compose-elastic.yml"
                )
                break
            elif frame.function == "keycloak_client":
                docker_compose_file = docker_compose_file.replace(
                    "docker-compose.yml", "docker-compose-keycloak.yml"
                )
                break

        print(f"Using docker-compose file: {docker_compose_file}")
        with get_docker_services(
            docker_compose_command,
            docker_compose_file,
            docker_compose_project_name,
            docker_setup,
            docker_cleanup,
        ) as docker_service:
            print("Docker services started")
            yield docker_service

    except Exception as e:
        print(f"Docker services could not be started: {e}")
        # Optionally, provide a fallback or mock service here
        raise


def is_mysql_responsive(host, port, user, password, database):
    try:
        # Create a MySQL connection
        connection = mysql.connector.connect(
            host=host, port=port, user=user, password=password, database=database
        )

        # Check if the connection is established
        if connection.is_connected():
            return True

    except Exception:
        print("Mysql still not up")
        pass

    return False


@pytest.fixture(scope="session")
def mysql_container(docker_ip, docker_services):
    try:
        if os.getenv("SKIP_DOCKER") or os.getenv("GITHUB_ACTIONS") == "true":
            print("Running in Github Actions or SKIP_DOCKER is set, skipping mysql")
            yield "mysql+pymysql://root:keep@localhost:3306/keep"
            return
        docker_services.wait_until_responsive(
            timeout=60.0,
            pause=0.1,
            check=lambda: is_mysql_responsive(
                "127.0.0.1", 3306, "root", "keep", "keep"
            ),
        )
        # set this as environment variable
        yield "mysql+pymysql://root:keep@localhost:3306/keep"
    except Exception:
        print("Exception occurred while waiting for MySQL to be responsive")
    finally:
        print("Tearing down MySQL")


@pytest.fixture
def db_session(request, monkeypatch):
    # Create a database connection
    print("Creating db session")
    os.environ["DB_ECHO"] = "true"
    if (
        request
        and hasattr(request, "param")
        and request.param
        and "db" in request.param
    ):
        db_type = request.param.get("db")
        db_connection_string = request.getfixturevalue(f"{db_type}_container")
        monkeypatch.setenv("DATABASE_CONNECTION_STRING", db_connection_string)
        t = SQLModel.metadata.tables["workflowexecution"]
        curr_index = next(
            (
                index
                for index in t.indexes
                if index.name == "idx_workflowexecution_workflow_tenant_started_status"
            )
        )
        t.indexes.remove(curr_index)
        status_index = Index(
            "idx_workflowexecution_workflow_tenant_started_status",
            "workflow_id",
            "tenant_id",
            "started",
            sqlalchemy.text("status(255)"),
        )
        t.append_constraint(status_index)
        mock_engine = create_engine(db_connection_string)
    # sqlite
    else:
        db_connection_string = "sqlite:///:memory:"
        mock_engine = create_engine(
            db_connection_string,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

        # @tb: leaving this here if anybody else gets to problem with nested transactions
        # https://docs.sqlalchemy.org/en/20/dialects/sqlite.html#serializable-isolation-savepoints-transactional-ddl
        @event.listens_for(mock_engine, "connect")
        def do_connect(dbapi_connection, connection_record):
            # disable pysqlite's emitting of the BEGIN statement entirely.
            # also stops it from emitting COMMIT before any DDL.
            dbapi_connection.isolation_level = None

        @event.listens_for(mock_engine, "begin")
        def do_begin(conn):
            # emit our own BEGIN
            try:
                conn.exec_driver_sql(text("BEGIN EXCLUSIVE"))
            except Exception:
                pass

    SQLModel.metadata.create_all(mock_engine)

    # Mock the environment variables so db.py will use it
    os.environ["DATABASE_CONNECTION_STRING"] = db_connection_string

    # Create a session
    # Passing class_=Session to use the Session class from sqlmodel (https://github.com/fastapi/sqlmodel/issues/75#issuecomment-2109911909)
    SessionLocal = sessionmaker(
        class_=Session, autocommit=False, autoflush=False, bind=mock_engine
    )
    session = SessionLocal()
    # Prepopulate the database with test data

    # 1. Create a tenant
    tenant_data = [
        Tenant(id=SINGLE_TENANT_UUID, name="test-tenant", created_by="tests@keephq.dev")
    ]
    session.add_all(tenant_data)
    session.commit()
    # 2. Create some workflows
    mock_raw_workflow = """workflow:
id: {}
actions:
  - name: send-slack-message
    provider:
      type: console
      with:
        message: "mock"
"""
    workflow_data = [
        Workflow(
            id="test-id-1",
            name="test-id-1",
            tenant_id=SINGLE_TENANT_UUID,
            description="test workflow",
            created_by="test@keephq.dev",
            interval=0,
            workflow_raw=mock_raw_workflow.format("test-id-1"),
        ),
        Workflow(
            id="test-id-2",
            name="test-id-2",
            tenant_id=SINGLE_TENANT_UUID,
            description="test workflow",
            created_by="test@keephq.dev",
            interval=0,
            workflow_raw=mock_raw_workflow.format("test-id-2"),
        ),
        WorkflowExecution(
            id="test-execution-id-1",
            workflow_id="test-id-1",
            tenant_id=SINGLE_TENANT_UUID,
            triggered_by="keep-test",
            status="success",
            execution_number=1,
            results={},
        ),
        WorkflowToAlertExecution(
            id=1,
            workflow_execution_id="test-execution-id-1",
            alert_fingerprint="mock_alert",
            event_id="mock_event_id",
        ),
        # Add more data as needed
    ]
    session.add_all(workflow_data)
    session.commit()

    with patch("techhala.api.core.db.engine", mock_engine):
        with patch("techhala.api.core.db_utils.create_db_engine", return_value=mock_engine):
            with patch("techhala.api.core.alerts.engine", mock_engine):
                yield session

    import logging

    logger = logging.getLogger(__name__)
    logger.info("Dropping all tables")
    # delete the database
    SQLModel.metadata.drop_all(mock_engine)
    # Clean up after the test
    session.close()


@pytest.fixture
def mocked_context_manager():
    context_manager = Mock(spec=ContextManager)
    # Simulate contexts as needed for each test case
    context_manager.steps_context = {}
    context_manager.providers_context = {}
    context_manager.event_context = {}
    context_manager.click_context = {}
    context_manager.foreach_context = {"value": None}
    context_manager.dependencies = set()
    context_manager.get_full_context.return_value = {
        "steps": {},
        "providers": {},
        "event": {},
        "alert": {},
        "foreach": {"value": None},
        "env": {},
    }
    context_manager.tenant_id = SINGLE_TENANT_UUID
    return context_manager


def is_keycloak_responsive(host, port, user, password):
    try:
        # Try to connect to Keycloak
        from keycloak import KeycloakAdmin

        keycloak_admin = KeycloakAdmin(
            server_url=f"http://{host}:{port}/auth/admin",
            username=user,
            password=password,
            realm_name="keeptest",
            verify=True,
        )
        keycloak_admin.get_client_id("keep")
        return True
    except Exception as e:
        import time

        print(f"Keycloak still not up [{e}] [{time.time()}]")
        pass

    return False


@pytest.fixture(scope="session")
def keycloak_container(docker_ip, docker_services):
    try:
        if os.getenv("SKIP_DOCKER") or os.getenv("GITHUB_ACTIONS") == "true":
            print("Running in Github Actions or SKIP_DOCKER is set, skipping keycloak")
            yield
            return
        docker_services.wait_until_responsive(
            timeout=100.0,
            pause=1,
            check=lambda: is_keycloak_responsive(
                "127.0.0.1",
                8787,
                os.environ["KEYCLOAK_ADMIN_USER"],
                os.environ["KEYCLOAK_ADMIN_PASSWORD"],
            ),
        )
        yield True
    except Exception:
        print("Exception occurred while waiting for Keycloak to be responsive")
        raise
    finally:
        print("Tearing down Keycloak")


def is_elastic_responsive(host, port, user, password):
    try:
        elastic_client = ElasticClient(
            tenant_id=SINGLE_TENANT_UUID,
            hosts=[f"http://{host}:{port}"],
            basic_auth=(user, password),
        )
        info = elastic_client._client.info()
        print("Elastic still up now")
        return True if info else False
    except Exception:
        print("Elastic still not up")
        pass

    return False


@pytest.fixture(scope="session")
def elastic_container(docker_ip, docker_services):
    try:
        if os.getenv("SKIP_DOCKER") or os.getenv("GITHUB_ACTIONS") == "true":
            print("Running in Github Actions or SKIP_DOCKER is set, skipping mysql")
            yield
            return
        docker_services.wait_until_responsive(
            timeout=60.0,
            pause=0.1,
            check=lambda: is_elastic_responsive(
                "127.0.0.1", 9200, "elastic", "keeptests"
            ),
        )
        yield True
    except Exception:
        print("Exception occurred while waiting for MySQL to be responsive")
        raise
    finally:
        print("Tearing down ElasticSearch")


@pytest.fixture
def elastic_client(request):
    # this is so if any other module initialized Elasticsearch, it will be deleted
    ElasticClient._instance = None
    os.environ["ELASTIC_ENABLED"] = "true"
    os.environ["ELASTIC_USER"] = "elastic"
    os.environ["ELASTIC_PASSWORD"] = "keeptests"
    os.environ["ELASTIC_HOSTS"] = "http://localhost:9200"
    os.environ["ELASTIC_INDEX_SUFFIX"] = "test"
    # request.getfixturevalue("elastic_container")
    elastic_client = ElasticClient(
        tenant_id=SINGLE_TENANT_UUID,
    )

    yield elastic_client

    # remove all from elasticsearch
    try:
        elastic_client.drop_index()
    except Exception:
        pass


@pytest.fixture(scope="session")
def keycloak_client(request):
    os.environ["KEYCLOAK_URL"] = "http://localhost:8787/auth/"
    os.environ["KEYCLOAK_REALM"] = "keeptest"
    os.environ["KEYCLOAK_ADMIN_USER"] = "admin@keeptest.com"
    os.environ["KEYCLOAK_ADMIN_PASSWORD"] = "adminpassword"
    os.environ["KEEP_USER"] = "testuser@example.com"
    os.environ["KEEP_PASSWORD"] = "testpassword"
    os.environ["KEYCLOAK_CLIENT_ID"] = "keep"
    os.environ["KEYCLOAK_CLIENT_SECRET"] = "keycloaktestsecret"
    # SHAHAR: this is a workaround since the api.py patches the request
    #         and Keycloak's library needs to allow redirect :(
    no_redirect_request = requests.Session.request
    requests.Session.request = original_request
    from keycloak import KeycloakAdmin

    # load the fixture
    request.getfixturevalue("keycloak_container")
    keycloak_admin = KeycloakAdmin(
        server_url=os.environ["KEYCLOAK_URL"],
        username=os.environ["KEYCLOAK_ADMIN_USER"],
        password=os.environ["KEYCLOAK_ADMIN_PASSWORD"],
        realm_name=os.environ["KEYCLOAK_REALM"],
        verify=True,
    )
    # assign admin role for the user
    # SHAHAR: since the role is created on on_start, we can provision it on realm.json
    user_id = keycloak_admin.get_user_id(os.environ["KEEP_USER"])
    client_id = keycloak_admin.get_client_id(os.environ["KEYCLOAK_CLIENT_ID"])
    # SHAHAR: this is a workaround since roles created on start
    keycloak_admin.create_client_role(
        client_id,
        {
            "name": "admin",
            "description": "Role for admin",
            # we will use this to identify the role as predefined
            "attributes": {
                "predefined": ["true"],
            },
        },
        skip_exists=True,
    )

    role_id = keycloak_admin.get_client_role_id(client_id, "admin")
    keycloak_admin.assign_client_role(
        user_id, client_id, [{"id": role_id, "name": "admin"}]
    )
    yield keycloak_admin
    # reset the request
    requests.Session.request = no_redirect_request
    print("Done with keycloak")


@pytest.fixture
def keycloak_token(request):
    keycloak_token_url = f"{os.environ['KEYCLOAK_URL']}/realms/{os.environ['KEYCLOAK_REALM']}/protocol/openid-connect/token"
    login_data = {
        "client_id": os.environ["KEYCLOAK_CLIENT_ID"],
        "client_secret": os.environ["KEYCLOAK_CLIENT_SECRET"],
        "grant_type": "password",
        "username": os.environ["KEEP_USER"],
        "password": os.environ["KEEP_PASSWORD"],
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    response = requests.post(keycloak_token_url, data=login_data, headers=headers)
    return response.json().get("access_token")


@pytest.fixture(scope="session")
def browser():
    from playwright.sync_api import sync_playwright

    try:
        tenant_id = f"keep{os.getpid()}"
        print("Creating tenant - ", tenant_id)
        resp = requests.post(
            "http://localhost:8080/tenant",
            json={"tenant_id": tenant_id},
        )
        resp.raise_for_status()
        print("Tenant created")
    except Exception as exc:
        print(exc)
    # Force headless mode if running in CI environment
    is_ci = os.getenv("CI") == "true" or os.getenv("GITHUB_ACTIONS") == "true"
    headless = is_ci or os.getenv("PLAYWRIGHT_HEADLESS", "true").lower() == "true"
    # headless = False

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            # macbook 13
            # viewport={"width": 1280, "height": 800},
        )
        context.grant_permissions(["clipboard-read", "clipboard-write"])
        page = context.new_page()
        page.set_default_timeout(5000)
        yield page
        context.close()
        browser.close()


def _create_valid_event(d, lastReceived=None):
    event = {
        "id": str(uuid.uuid4()),
        "name": "some-test-event",
        "status": "firing",
        "lastReceived": (
            str(lastReceived)
            if lastReceived
            else datetime.now(tz=timezone.utc).isoformat()
        ),
    }
    event.update(d)
    return event


@pytest.fixture
def setup_alerts(elastic_client, db_session, request):
    alert_details = request.param.get("alert_details")
    alerts = []
    for i, detail in enumerate(alert_details):
        # sleep to avoid same lastReceived
        time.sleep(0.02)
        detail["fingerprint"] = f"test-{i}"
        if "source" in detail:
            source = detail["source"][0]
        alerts.append(
            Alert(
                tenant_id=SINGLE_TENANT_UUID,
                provider_type=source,
                provider_id="test",
                event=_create_valid_event(detail),
                fingerprint=detail["fingerprint"],
            )
        )
    db_session.add_all(alerts)
    db_session.commit()

    existed_last_alerts = db_session.query(LastAlert).all()
    existed_last_alerts_dict = {
        last_alert.fingerprint: last_alert for last_alert in existed_last_alerts
    }

    last_alerts = []
    for alert in alerts:
        if alert.fingerprint in existed_last_alerts_dict:
            last_alert = existed_last_alerts_dict[alert.fingerprint]
            last_alert.alert_id = alert.id
            last_alert.timestamp = alert.timestamp
            last_alerts.append(last_alert)
        else:
            last_alerts.append(
                LastAlert(
                    tenant_id=SINGLE_TENANT_UUID,
                    fingerprint=alert.fingerprint,
                    timestamp=alert.timestamp,
                    first_timestamp=alert.timestamp,
                    alert_id=alert.id,
                )
            )
    db_session.add_all(last_alerts)
    db_session.commit()

    # add all to elasticsearch
    alerts_dto = convert_db_alerts_to_dto_alerts(alerts)
    elastic_client.index_alerts(alerts_dto)


@pytest.fixture
def setup_stress_alerts_no_elastic(db_session):

    def _setup_stress_alerts_no_elastic(num_alerts):
        alert_details = [
            {
                "source": [
                    "source_{}".format(i % 10)
                ],  # Cycle through 10 different sources
                "service": "service_{}".format(
                    i % 10
                ),  # Random of 10 different services
                "severity": random.choice(
                    ["info", "warning", "critical"]
                ),  # Alternate between 'critical' and 'warning'
                "fingerprint": f"test-{i}",
            }
            for i in range(num_alerts)
        ]
        alerts = []
        for i, detail in enumerate(alert_details):
            random_timestamp = datetime.utcnow() - timedelta(days=random.uniform(0, 7))
            alerts.append(
                Alert(
                    timestamp=random_timestamp,
                    tenant_id=SINGLE_TENANT_UUID,
                    provider_type=detail["source"][0],
                    provider_id="test_{}".format(
                        i % 5
                    ),  # Cycle through 5 different provider_ids
                    event=_create_valid_event(detail, lastReceived=random_timestamp),
                    fingerprint="fingerprint_{}".format(i),
                )
            )
        db_session.add_all(alerts)
        db_session.commit()

        existed_last_alerts = db_session.query(LastAlert).all()
        existed_last_alerts_dict = {
            last_alert.fingerprint: last_alert for last_alert in existed_last_alerts
        }
        last_alerts = []
        for alert in alerts:
            if alert.fingerprint in existed_last_alerts_dict:
                last_alert = existed_last_alerts_dict[alert.fingerprint]
                last_alert.alert_id = alert.id
                last_alert.timestamp = alert.timestamp
                last_alerts.append(last_alert)
            else:
                last_alerts.append(
                    LastAlert(
                        tenant_id=SINGLE_TENANT_UUID,
                        fingerprint=alert.fingerprint,
                        timestamp=alert.timestamp,
                        first_timestamp=alert.timestamp,
                        alert_id=alert.id,
                    )
                )
        db_session.add_all(last_alerts)
        db_session.commit()

        return alerts

    return _setup_stress_alerts_no_elastic


@pytest.fixture
def setup_stress_alerts(
    elastic_client, db_session, request, setup_stress_alerts_no_elastic
):
    num_alerts = request.param.get(
        "num_alerts", 1000
    )  # Default to 1000 alerts if not specified
    alerts = setup_stress_alerts_no_elastic(num_alerts)
    # add all to elasticsearch
    alerts_dto = convert_db_alerts_to_dto_alerts(alerts)
    elastic_client.index_alerts(alerts_dto)


@pytest.fixture
def create_alert(db_session):
    def _create_alert(
        fingerprint, status, timestamp, details=None, tenant_id=SINGLE_TENANT_UUID
    ):
        details = details or {}
        random_name = "test-{}".format(fingerprint)
        process_event(
            ctx={"job_try": 1},
            trace_id="test",
            tenant_id=tenant_id,
            provider_id="test",
            provider_type=(
                details["source"][0]
                if details and "source" in details and details["source"]
                else None
            ),
            fingerprint=fingerprint,
            api_key_name="test",
            event={
                "name": random_name,
                "fingerprint": fingerprint,
                "lastReceived": details.pop("lastReceived", timestamp.isoformat()),
                "status": status.value,
                **details,
            },
            notify_client=False,
            timestamp_forced=timestamp,
        )

    return _create_alert


def pytest_addoption(parser):
    """
    Adds configuration options for integration tests
    """

    parser.addoption(
        "--integration", action="store_const", const=True, dest="run_integration"
    )
    parser.addoption(
        "--non-integration",
        action="store_const",
        const=True,
        dest="run_non_integration",
    )


def pytest_configure(config):
    """
    Adds markers for integration tests
    """
    config.addinivalue_line(
        "markers", "integration: mark test to run only if integrations tests enabled"
    )


@pytest.hookimpl(tryfirst=True)
def pytest_runtest_setup(item):
    """
    Checks whether tests should be skipped based on integration settings
    """

    run_integration = item.config.getoption("run_integration")
    run_non_integration = item.config.getoption("run_non_integration")

    if run_integration and run_non_integration is None:
        run_non_integration = False
    if run_non_integration and run_integration is None:
        run_integration = False

    if item.get_closest_marker("integration"):
        if run_integration in (None, True):
            return
        pytest.skip("Integration tests skipped")
    else:
        if run_non_integration in (None, True):
            return
        pytest.skip("Non-Integration tests skipped")


def pytest_collection_modifyitems(items):
    for item in items:
        fixturenames = getattr(item, "fixturenames", ())
        if "elastic_client" in fixturenames:
            item.add_marker("integration")
        elif "keycloak_client" in fixturenames:
            item.add_marker("integration")
        elif (
            hasattr(item, "callspec")
            and "db_session" in item.callspec.params
            and item.callspec.params["db_session"]
            and "db" in item.callspec.params["db_session"]
        ):
            item.add_marker("integration")


@pytest.fixture
def console_logs():
    """Fixture to collect console logs during test execution."""
    logs = []
    return logs


@pytest.fixture
def setup_page_logging(browser, console_logs):
    """Fixture to set up console logging for a page."""
    # Console logging
    browser.on(
        "console",
        lambda msg: (
            console_logs.append(
                f"{datetime.now()}: {msg.text}, location: {msg.location}"
            )
        ),
    )

    # Request logging
    browser.on(
        "request",
        lambda request: (
            console_logs.append(
                f"{datetime.now()}: REQUEST: {request.method} {request.url}"
            )
        ),
    )

    # Response logging
    browser.on(
        "response",
        lambda response: (
            console_logs.append(
                f"{datetime.now()}: RESPONSE: {response.status} {response.url}"
            )
        ),
    )

    browser.on(
        "requestfailed",
        lambda request: (
            console_logs.append(
                f"{datetime.now()}: REQUEST FAILED: {request.method} {request.url}"
            )
        ),
    )

    return browser


@pytest.fixture
def failure_artifacts(browser, console_logs, request):
    """Fixture to automatically save failure artifacts on test failure."""
    yield

    # Only save artifacts if the test failed
    if request.node.rep_call.failed:
        test_name = (
            "playwright_dump_"
            + os.path.basename(request.node.fspath)[:-3]
            + "_"
            + request.node.name
        )

        # Save each artifact type independently
        artifacts_saved = []
        artifacts_failed = []

        # Try to save screenshot
        try:
            browser.screenshot(path=test_name + ".png")
            artifacts_saved.append("screenshot")
        except Exception as e:
            artifacts_failed.append(f"screenshot: {str(e)}")

        # Try to save HTML content
        try:
            with open(test_name + ".html", "w", encoding="utf-8") as f:
                f.write(browser.content())
            artifacts_saved.append("html")
        except Exception as e:
            artifacts_failed.append(f"html: {str(e)}")

        # Try to save console logs
        try:
            # Add debug info about console logs
            print(f"\nNumber of console logs captured: {len(console_logs)}")
            if console_logs:
                with open(test_name + "_console.txt", "w", encoding="utf-8") as f:
                    f.write("\n".join(console_logs))
                artifacts_saved.append("console logs")
            else:
                artifacts_failed.append("console logs: No logs were captured")
        except Exception as e:
            artifacts_failed.append(f"console logs: {str(e)}")

        # Try to save cookies
        try:
            cookies = browser.context.cookies()
            print(f"\nNumber of cookies found: {len(cookies)}")
            if cookies:
                with open(test_name + "_cookies.json", "w", encoding="utf-8") as f:
                    json.dump(cookies, f, indent=2)
                artifacts_saved.append("cookies")
            else:
                artifacts_failed.append("cookies: No cookies were present")
        except Exception as e:
            artifacts_failed.append(f"cookies: {str(e)}")

        # Log summary of what was saved and what failed
        print(f"\nFailure artifacts for {test_name}:")
        if artifacts_saved:
            print(f"Successfully saved: {', '.join(artifacts_saved)}")
        if artifacts_failed:
            print(f"Failed to save or empty: {', '.join(artifacts_failed)}")


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call) -> Generator[None, Any, Any]:
    """Hook to store test results for use in fixtures."""
    outcome = yield
    rep = outcome.get_result()

    # Set report for each phase (setup, call, teardown)
    setattr(item, f"rep_{rep.when}", rep)
