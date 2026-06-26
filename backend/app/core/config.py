"""
SmartSupply AI — Application Configuration

Centralized settings management using pydantic-settings.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # --- Application ---
    APP_NAME: str = "SmartSupply AI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_VERSION: str = "v1"

    # --- Database (Supabase) ---
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/smartsupply"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10

    # --- Supabase ---
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""

    # --- Redis ---
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_PREFIX: str = "ss:"

    # --- Elasticsearch ---
    ELASTICSEARCH_URL: str = "http://localhost:9200"

    # --- Kafka ---
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"

    # --- Authentication ---
    JWT_SECRET: str = "super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # --- CORS ---
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://app.smartsupply.ai",
        "https://admin.smartsupply.ai",
    ]

    # --- AI ---
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # --- Payment ---
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    STRIPE_SECRET_KEY: str = ""

    # --- Notifications ---
    SENDGRID_API_KEY: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # --- Storage ---
    S3_BUCKET: str = "smartsupply-uploads"
    S3_REGION: str = "ap-south-1"
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""

    # --- Rate Limiting ---
    RATE_LIMIT_DEFAULT: int = 100  # requests per minute
    RATE_LIMIT_AUTH: int = 10  # login attempts per minute

    # --- Monitoring ---
    SENTRY_DSN: str = ""


settings = Settings()
