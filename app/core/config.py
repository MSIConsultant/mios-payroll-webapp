from typing import List, Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "postgresql://payroll_user:payroll_password@localhost:5432/payroll_db"
    database_echo: bool = False
    database_pool_size: int = 20
    database_max_overflow: int = 0
    
    # Application
    app_name: str = "MIOS Payroll Engine"
    app_version: str = "2.0.0"
    debug: bool = True
    environment: str = "development"
    
    # API
    api_prefix: str = "/api/v1"
    
    # Security & JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production-use-secrets-manager"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    cors_credentials: bool = True
    cors_methods: List[str] = ["*"]
    cors_headers: List[str] = ["*"]
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4
    
    # Redis (for caching & sessions)
    redis_url: str = "redis://localhost:6379"
    redis_enabled: bool = False
    cache_ttl_ptkp: int = 86400  # 24 hours
    cache_ttl_reference: int = 86400  # 24 hours
    
    # Email (for password reset, notifications)
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@mios.id"
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "json"  # "json" for production, "text" for development
    sentry_dsn: Optional[str] = None
    
    # Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100
    rate_limit_period: int = 60  # seconds
    
    # File Upload
    max_upload_size: int = 10 * 1024 * 1024  # 10MB
    allowed_extensions: List[str] = ["xlsx", "xls", "csv"]
    
    # Feature Flags
    enable_two_factor_auth: bool = False
    enable_audit_logging: bool = True
    enable_api_documentation: bool = True
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.environment.lower() in ["production", "prod"]
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.environment.lower() in ["development", "dev", "local"]
    
    @property
    def is_testing(self) -> bool:
        """Check if running in testing environment"""
        return self.environment.lower() in ["testing", "test"]


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Create a global settings instance for convenient access
settings = get_settings()