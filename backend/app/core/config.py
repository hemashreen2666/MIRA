"""
Centralized application configuration.

Reads from environment variables / .env file. Never hard-code secrets here.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_ENV: str = "development"
    APP_NAME: str = "MIRA Backend"
    API_V1_PREFIX: str = "/api/v1"

    # Default: a local SQLite file — no server, no account, fully offline,
    # which matches MIRA's privacy-first, single-device design. Override with
    # a postgresql+psycopg2://... URL in .env for a multi-device setup.
    DATABASE_URL: str = "sqlite:///./mira.db"

    CORS_ORIGINS: str = "http://localhost:5173"

    LOG_LEVEL: str = "INFO"

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.APP_ENV.lower() == "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()
