"""
VeriFact Backend — Core Configuration
Loads settings from environment variables with validation.
"""

from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────────
    app_name: str = "VeriFact"
    app_env: str = "development"
    app_debug: bool = True
    app_secret_key: str = "change-me-to-a-random-64-char-string"
    app_url: str = "http://localhost:3000"
    api_url: str = "http://localhost:8000"

    # ── Database ─────────────────────────────────────────────────────────────
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_user: str = "verifact"
    postgres_password: str = "verifact_dev_password"
    postgres_db: str = "verifact"
    database_url_override: Optional[str] = None
    use_sqlite: bool = True

    @property
    def database_url(self) -> str:
        if self.database_url_override:
            return self.database_url_override
        if self.use_sqlite:
            return "sqlite+aiosqlite:///./verifact.db"
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def database_url_sync(self) -> str:
        if self.use_sqlite:
            return "sqlite:///./verifact.db"
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    # ── Redis ────────────────────────────────────────────────────────────────
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""
    redis_url: str = "redis://localhost:6379/0"

    # ── Authentication ───────────────────────────────────────────────────────
    google_client_id: str = ""
    google_client_secret: str = ""
    nextauth_secret: str = "change-me-to-a-random-secret"

    # ── AI Provider API Keys ─────────────────────────────────────────────────
    gemini_api_key: str = ""
    groq_api_key: str = ""
    google_fact_check_api_key: str = ""
    news_api_key: str = ""
    news_api_provider: str = "newsapi"
    reverse_image_api_key: str = ""
    reverse_image_provider: str = ""

    # ── Local AI ─────────────────────────────────────────────────────────────
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1"

    # ── Model Configuration ──────────────────────────────────────────────────
    model_cache_dir: str = "./models"
    device: str = "cpu"
    max_model_memory_gb: float = 4.0
    lazy_load_models: bool = True

    # ── Neo4j ────────────────────────────────────────────────────────────────
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = ""

    # ── Application Modes ────────────────────────────────────────────────────
    demo_mode: bool = False
    enable_real_ai: bool = True
    enable_local_ai: bool = False

    # ── Rate Limiting ────────────────────────────────────────────────────────
    rate_limit_requests_per_minute: int = 30
    rate_limit_analyses_per_hour: int = 10

    # ── Logging ──────────────────────────────────────────────────────────────
    log_level: str = "INFO"
    log_format: str = "json"

    # ── CORS ─────────────────────────────────────────────────────────────────
    cors_origins: list[str] = ["http://localhost:3000"]

    def is_provider_configured(self, provider: str) -> bool:
        """Check if a provider has API credentials configured."""
        key_map = {
            "gemini": self.gemini_api_key,
            "groq": self.groq_api_key,
            "fact_check": self.google_fact_check_api_key,
            "news": self.news_api_key,
            "reverse_image": self.reverse_image_api_key,
        }
        key = key_map.get(provider, "")
        return bool(key and key.strip())


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
