from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
import os
import asyncio
from typing import Optional

from app.utils.cache import get_cache


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Simple Redis-backed rate limiter middleware.

    Limits requests by `key = ip:path` with a small TTL window.
    Uses `REDIS_URL` when available, otherwise falls back to in-memory cache.
    """

    def __init__(self, app, calls: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.calls = int(os.getenv("RATE_LIMIT_PER_MIN", str(calls)))
        self.window = int(os.getenv("RATE_LIMIT_WINDOW", str(window_seconds)))
        self._cache = get_cache()

    async def dispatch(self, request: Request, call_next):
        try:
            client_ip = request.client.host if request.client else "unknown"
        except Exception:
            client_ip = "unknown"

        key = f"rate:{client_ip}:{request.url.path}"

        try:
            current = await self._cache.get(key)
            if current is None:
                await self._cache.set(key, "1", ttl=self.window)
                remaining = self.calls - 1
            else:
                count = int(current)
                if count >= self.calls:
                    return JSONResponse({"detail": "Rate limit exceeded"}, status_code=429)
                await self._cache.set(key, str(count + 1), ttl=self.window)
                remaining = self.calls - (count + 1)
        except Exception:
            # On cache errors, allow the request (fail open)
            return await call_next(request)

        response = await call_next(request)
        # Optionally add rate-limit headers
        response.headers["X-RateLimit-Limit"] = str(self.calls)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        return response
