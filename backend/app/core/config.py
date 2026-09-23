from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load backend/.env by absolute path so it's found regardless of the working directory.
_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILE, extra="ignore")

    app_name: str = "PhysioDesk API"
    environment: str = "development"

    # Required (no default) so a missing value fails fast instead of using an insecure fallback.
    database_url: str
    jwt_secret: str

    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # Comma-separated list of allowed frontend origins.
    cors_origins: str = "http://localhost:3000"

    # Rate limiting: honor X-Forwarded-For behind a proxy; counter storage backend.
    trust_proxy: bool = False
    rate_limit_storage_uri: str = "memory://"

    @field_validator("jwt_secret")
    @classmethod
    def _secret_strong_enough(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
