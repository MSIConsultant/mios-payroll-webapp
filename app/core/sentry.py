"""Sentry initialization helper for MIOS Payroll"""
import os


def init_sentry(app):
    """Initialize Sentry if SENTRY_DSN is provided in the environment.

    Safe to call in dev; if DSN is not present this is a no-op.
    """
    dsn = os.getenv("SENTRY_DSN")
    if not dsn:
        return False
    try:
        import sentry_sdk
        from sentry_sdk.integrations.asgi import SentryAsgiMiddleware

        sentry_sdk.init(dsn=dsn, traces_sample_rate=float(os.getenv("SENTRY_TRACES", "0.05")))
        # Add middleware to capture errors and performance
        app.add_middleware(SentryAsgiMiddleware)
        return True
    except Exception:
        # Do not crash app if Sentry initialization fails
        return False
