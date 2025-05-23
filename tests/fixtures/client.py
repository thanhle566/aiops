import hashlib
import importlib
import sys

import pytest
from fastapi.testclient import TestClient

from techhala.api.core.dependencies import SINGLE_TENANT_UUID
from techhala.api.models.db.tenant import TenantApiKey


@pytest.fixture
def test_app(monkeypatch, request):
    monkeypatch.setenv("KEEP_USE_LIMITER", "false")
    # Check if request.param is a dict or a string
    if isinstance(request.param, dict):
        # Set environment variables based on the provided dictionary
        for key, value in request.param.items():
            monkeypatch.setenv(key, str(value))
    else:
        # Old behavior for string parameters
        auth_type = request.param
        monkeypatch.setenv("AUTH_TYPE", auth_type)
        monkeypatch.setenv("KEEP_JWT_SECRET", "somesecret")

        if auth_type == "MULTI_TENANT":
            monkeypatch.setenv("AUTH0_DOMAIN", "https://auth0domain.com")

    # Clear and reload modules to ensure environment changes are reflected
    for module in list(sys.modules):
        if module.startswith("techhala.api.routes"):
            del sys.modules[module]

        # this is a fucking bug in db patching ffs it ruined my saturday
        elif module.startswith("techhala.providers.providers_service"):
            importlib.reload(sys.modules[module])

    if "techhala.api.api" in sys.modules:
        importlib.reload(sys.modules["techhala.api.api"])

    if "techhala.api.config" in sys.modules:
        importlib.reload(sys.modules["techhala.api.config"])

    # Import and return the app instance
    from techhala.api.api import get_app
    from techhala.api.config import provision_resources

    provision_resources()
    app = get_app()
    return app


# Fixture for TestClient using the test_app fixture
@pytest.fixture
def client(test_app, db_session, monkeypatch):
    # Your existing environment setup
    monkeypatch.setenv("PUSHER_DISABLED", "true")
    monkeypatch.setenv("KEEP_DEBUG_TASKS", "true")
    monkeypatch.setenv("LOGGING_LEVEL", "DEBUG")
    monkeypatch.setenv("SQLALCHEMY_WARN_20", "1")

    with TestClient(test_app) as client:
        yield client


# Common setup for tests
def setup_api_key(
    db_session, api_key_value, tenant_id=SINGLE_TENANT_UUID, role="admin"
):
    hash_api_key = hashlib.sha256(api_key_value.encode()).hexdigest()
    db_session.add(
        TenantApiKey(
            tenant_id=tenant_id,
            reference_id="test_api_key",
            key_hash=hash_api_key,
            created_by="admin@keephq",
            role=role,
        )
    )
    db_session.commit()
