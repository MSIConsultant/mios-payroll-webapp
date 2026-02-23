from fastapi import FastAPI
from app.api.router import api_router
import os
from app.core.config import settings
from app.core.sentry import init_sentry
from app.middleware.rate_limiter import RateLimiterMiddleware

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Payroll Engine API for MIOS"
)

# Initialize Sentry (no-op if SENTRY_DSN not set)
try:
    init_sentry(app)
except Exception:
    # keep app startup resilient
    pass

# Add rate limiter middleware if enabled
try:
    if os.getenv("ENABLE_RATE_LIMIT", "true").lower() in ("1", "true", "yes"):
        app.add_middleware(RateLimiterMiddleware)
except Exception:
    pass


@app.get("/", tags=["root"])
def read_root():
    """Welcome endpoint"""
    return {
        "message": "Welcome to MIOS Payroll Engine",
        "version": settings.app_version,
        "docs_url": "/docs",
        "openapi_url": "/openapi.json"
    }


@app.get("/health", tags=["health"])
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": settings.app_name}


# Include the API router with /api/v1 prefix
app.include_router(api_router, prefix=settings.api_prefix)