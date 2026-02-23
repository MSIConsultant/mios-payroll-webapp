"""Simple Redis cache helper for MIOS Payroll.

Provides async Redis wrapper with JSON serialization and optional in-memory fallback when
`REDIS_URL` is not provided (useful for local/dev).
"""
import os
import json
import asyncio
from typing import Any, Optional

try:
    import redis.asyncio as aioredis
except Exception:
    aioredis = None


class InMemoryCache:
    def __init__(self):
        self._store = {}
        self._locks = {}

    async def get(self, key: str) -> Optional[str]:
        item = self._store.get(key)
        if not item:
            return None
        value, expires_at = item
        if expires_at and expires_at < asyncio.get_event_loop().time():
            del self._store[key]
            return None
        return value

    async def set(self, key: str, value: str, ttl: Optional[int] = None):
        expires_at = None
        if ttl:
            expires_at = asyncio.get_event_loop().time() + ttl
        self._store[key] = (value, expires_at)

    async def delete(self, key: str):
        self._store.pop(key, None)


class RedisCache:
    def __init__(self, url: str):
        if aioredis is None:
            raise RuntimeError("redis.asyncio is not available; install redis>=4.5.0")
        self._client = aioredis.from_url(url, encoding="utf-8", decode_responses=True)

    async def get(self, key: str) -> Optional[str]:
        return await self._client.get(key)

    async def set(self, key: str, value: str, ttl: Optional[int] = None):
        if ttl:
            await self._client.set(key, value, ex=ttl)
        else:
            await self._client.set(key, value)

    async def delete(self, key: str):
        await self._client.delete(key)


# Factory
_cache = None

def get_cache():
    global _cache
    if _cache is None:
        redis_url = os.getenv("REDIS_URL")
        if redis_url:
            try:
                _cache = RedisCache(redis_url)
            except Exception:
                _cache = InMemoryCache()
        else:
            _cache = InMemoryCache()
    return _cache


# Helper to cache function results (async)
def cached(ttl: Optional[int] = None, key_fn: Optional[Any] = None):
    def decorator(fn):
        async def wrapper(*args, **kwargs):
            cache = get_cache()
            key = key_fn(*args, **kwargs) if key_fn else f"cache:{fn.__module__}.{fn.__name__}:{args}:{kwargs}"
            try:
                raw = await cache.get(key)
                if raw is not None:
                    return json.loads(raw)
            except Exception:
                pass
            result = await fn(*args, **kwargs)
            try:
                await cache.set(key, json.dumps(result), ttl)
            except Exception:
                pass
            return result
        return wrapper
    return decorator
