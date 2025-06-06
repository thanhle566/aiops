import dataclasses
from collections import defaultdict

import grpc
import pydantic

from techhala.api.models.db.topology import TopologyServiceInDto
from techhala.contextmanager.contextmanager import ContextManager
from techhala.providers.base.base_provider import BaseTopologyProvider
from techhala.providers.models.provider_config import ProviderConfig
from techhala.validation.fields import NoSchemeUrl


@pydantic.dataclasses.dataclass
class CiliumProviderAuthConfig:
    """Cilium authentication configuration."""

    cilium_base_endpoint: NoSchemeUrl = dataclasses.field(
        metadata={
            "required": True,
            "description": "The base endpoint of the cilium hubble relay",
            "sensitive": False,
            "hint": "localhost:4245",
            "validation": "no_scheme_url",
        }
    )


class CiliumProvider(BaseTopologyProvider):
    """Manage Cilium provider."""

    PROVIDER_TAGS = ["topology"]
    PROVIDER_DISPLAY_NAME = "Cilium"
    PROVIDER_CATEGORY = ["Cloud Infrastructure", "Security"]

    def __init__(
        self, context_manager: ContextManager, provider_id: str, config: ProviderConfig
    ):
        super().__init__(context_manager, provider_id, config)

    def validate_scopes(self):
        """
        Validates that the user has the required scopes to use the provider.
        """
        return {}

    def validate_config(self):
        self.authentication_config = CiliumProviderAuthConfig(
            **self.config.authentication
        )

    def _extract_name_from_label(self, label: str) -> str:
        if label.startswith("k8s:app="):
            return label.split("=")[1]
        elif label.startswith("k8s:app.kubernetes.io/name="):
            return label.split("=")[1]

        return None

    def _get_service_name(self, endpoint) -> str:
        # 1. try to get from workfload
        if endpoint.workloads:
            return endpoint.workloads[0].name
        # 2. try to get from labels
        for label in endpoint.labels:
            name = self._extract_name_from_label(label)
            if name:
                return name
        # 3. try to get from pod name
        service = endpoint.pod_name
        parts = service.split("-")
        if len(parts) > 2:
            return "-".join(parts[:-2])
        elif len(parts) == 2:
            return parts[0]

        if not service:
            return "unknown"
        return service

    def pull_topology(self) -> list[TopologyServiceInDto]:
        # for some providers that depends on grpc like cilium provider, this might fail on imports not from Keep (such as the docs script)
        from techhala.providers.cilium_provider.grpc.observer_pb2 import (  # noqa
            FlowFilter,
            GetFlowsRequest,
        )
        from techhala.providers.cilium_provider.grpc.observer_pb2_grpc import (  # noqa
            ObserverStub,
        )

        channel = grpc.insecure_channel(self.authentication_config.cilium_base_endpoint)
        stub = ObserverStub(channel)

        # Create a request for the last 1000 flows
        request = GetFlowsRequest(
            number=1000, whitelist=[FlowFilter(source_pod={}, destination_pod={})]
        )

        # Query the API
        responses = stub.GetFlows(request)

        # Process the responses
        service_map = defaultdict(lambda: {"dependencies": set(), "namespace": ""})
        # https://docs.cilium.io/en/stable/_api/v1/flow/README/#flow-FlowFilter

        # get the responses as list
        responses = list(responses)

        # Track applications and their services
        application_to_services = {}
        application_to_name = {}

        for response in responses:
            flow = response.flow
            if not flow.source:
                continue
            # https://docs.cilium.io/en/stable/_api/v1/flow/README/#endpoint
            if flow.source.pod_name and flow.destination.pod_name:
                source = self._get_service_name(flow.source)
                destination = self._get_service_name(flow.destination)

                source_namespace = flow.source.namespace
                destination_namespace = flow.destination.namespace

                node_labels = list(flow.node_labels)

                destination_port = flow.l4.TCP.destination_port
                # source_port = flow.l4.TCP.source_port

                category = "http"

                if destination_port == 5432:
                    category = "postgres"

                # Check for application label
                try:
                    application_label = [
                        label
                        for label in flow.source.labels
                        if label.startswith("k8s:keepapp=")
                    ]
                    # If no application label, skip
                    if not application_label:
                        continue
                    application_id = application_label[0].split("=")[1]

                    # Store application name (using app ID as name for now)
                    application_to_name[application_id] = application_id

                    # Add service to application
                    if application_id not in application_to_services:
                        application_to_services[application_id] = set()
                    application_to_services[application_id].add(source)
                except Exception:
                    pass

                service_map[source]["dependencies"].add(destination)
                service_map[source]["namespace"] = source_namespace
                service_map[source]["tags"] = list(flow.source.labels)
                service_map[source]["tags"].append(flow.source.pod_name)
                service_map[source]["tags"].append(flow.source.cluster_name)
                service_map[source]["tags"] += node_labels

                if destination not in service_map:
                    service_map[destination] = {
                        "dependencies": set(),
                        "namespace": destination_namespace or "internet",
                    }
                    service_map[destination]["dependencies"].add(source)
                    service_map[destination]["tags"] = list(flow.destination.labels)
                    service_map[destination]["category"] = category
                else:
                    service_map[destination]["dependencies"].add(source)
                    service_map[destination]["tags"] = list(flow.destination.labels)
            # if its outside the cluster
            elif (
                flow.destination
                and flow.destination.labels
                and "reserved:world" in flow.destination.labels
            ):
                source = self._get_service_name(flow.source)
                destination = flow.IP.destination
                source_namespace = flow.source.namespace

                node_labels = list(flow.node_labels)

                destination_port = flow.l4.TCP.destination_port
                # source_port = flow.l4.TCP.source_port

                category = "http"

                if destination_port == 5432:
                    category = "postgres"

                service_map[source]["dependencies"].add(destination)
                service_map[source]["namespace"] = source_namespace
                service_map[source]["tags"] = list(flow.source.labels)
                service_map[source]["tags"].append(flow.source.pod_name)
                service_map[source]["tags"].append(flow.source.cluster_name)
                service_map[source]["tags"] += node_labels

                # Check if this source service belongs to any applications
                for app_id, services in application_to_services.items():
                    if source in services:
                        self.logger.debug(
                            f"Adding {destination} to application {app_id}"
                        )
                        application_to_services[app_id].add(destination)

                if destination not in service_map:
                    service_map[destination] = {
                        "dependencies": set(),
                        "namespace": "internet",
                    }  # destination_namespace is external
                    service_map[destination]["dependencies"].add(source)
                    service_map[destination]["tags"] = list(flow.destination.labels)
                    service_map[destination]["category"] = category
                else:
                    service_map[destination]["dependencies"].add(source)
                    service_map[destination]["tags"] = list(flow.destination.labels)

        # Convert to TopologyServiceInDto
        topology = []
        app_ids_to_uuids = {}
        for service, data in service_map.items():
            try:
                # Create application_relations dictionary for this service
                application_relations = {}
                for app_id, services in application_to_services.items():
                    if service in services:
                        # idk what Jay did...
                        import uuid

                        if app_id in app_ids_to_uuids:
                            app_uuid = app_ids_to_uuids[app_id]
                        else:
                            app_ids_to_uuids[app_id] = uuid.uuid4()
                            app_uuid = app_ids_to_uuids[app_id]
                        application_relations[app_uuid] = app_id

                topology_service = TopologyServiceInDto(
                    source_provider_id=self.provider_id,
                    service=service,
                    display_name=service,
                    environment=data["namespace"],
                    dependencies={dep: "network" for dep in data["dependencies"]},
                    tags=list(data["tags"]),
                    category=data.get("category", "http"),
                    namespace=data["namespace"],
                    application_relations=(
                        application_relations if application_relations else None
                    ),
                )
                topology.append(topology_service)
            except Exception as e:
                self.logger.error(
                    "Error processing service",
                    extra={
                        "service": service,
                        "data": data,
                        "error": str(e),
                    },
                )
                pass

        self.logger.info(
            "Topology pulling completed",
            extra={
                "tenant_id": self.context_manager.tenant_id,
                "len_of_topology": len(topology),
            },
        )
        # Return only the topology data as the application info is now included in each service
        return topology, {}

    def get_existing_services(self, all_services):
        """Helper function to create a set of all valid service names"""
        return {service for service in all_services}

    def dispose(self):
        """
        No need to dispose of anything, so just do nothing.
        """
        pass


if __name__ == "__main__":
    # Output debug messages
    import logging

    logging.basicConfig(level=logging.DEBUG, handlers=[logging.StreamHandler()])
    context_manager = ContextManager(
        tenant_id="singletenant",
        workflow_id="test",
    )
    # Load environment variables

    cilium_base_endpoint = "localhost:4245"

    # Initialize the provider and provider config
    config = ProviderConfig(
        description="Cilium Provider",
        authentication={
            "cilium_base_endpoint": cilium_base_endpoint,
        },
    )
    provider = CiliumProvider(context_manager, provider_id="cilium", config=config)
    r, _ = provider.pull_topology()
    print(r)
