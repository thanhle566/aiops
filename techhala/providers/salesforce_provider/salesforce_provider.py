import dataclasses

import pydantic

from techhala.contextmanager.contextmanager import ContextManager
from techhala.providers.base.base_provider import BaseProvider
from techhala.providers.models.provider_config import ProviderConfig


@pydantic.dataclasses.dataclass
class SalesforceProviderAuthConfig:
    api_key: str = dataclasses.field(
        metadata={
            "required": True,
            "description": "Salesforce API key",
            "sensitive": True,
        }
    )


class SalesforceProvider(BaseProvider):
    PROVIDER_DISPLAY_NAME = "Salesforce"
    PROVIDER_CATEGORY = ["CRM"]
    PROVIDER_COMING_SOON = True

    def __init__(
        self, context_manager: ContextManager, provider_id: str, config: ProviderConfig
    ):
        super().__init__(context_manager, provider_id, config)

    def validate_config(self):
        self.authentication_config = SalesforceProviderAuthConfig(
            **self.config.authentication
        )

    def dispose(self):
        """
        No need to dispose of anything, so just do nothing.
        """
        pass
