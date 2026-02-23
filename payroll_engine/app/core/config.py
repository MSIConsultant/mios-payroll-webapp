from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "postgresql://user:password@localhost:5432/payroll_db"
    
    # Application
    app_name: str = "Payroll Engine"
    app_version: str = "1.0.0"
    debug: bool = True
    environment: str = "development"
    
    # API
    api_prefix: str = "/api/v1"
    secret_key: str = "your-secret-key-change-this-in-production"
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    cors_credentials: bool = True
    cors_methods: List[str] = ["*"]
    cors_headers: List[str] = ["*"]
    
    # JWT
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Tax Configuration
    tax_year: int = 2026
    tax_method: str = "progressive"  # progressive or flat
    
    # BPJS Configuration
    bpjs_enabled: bool = True
    bpjs_health_percentage: float = 4.0
    bpjs_work_percentage: float = 0.24
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
