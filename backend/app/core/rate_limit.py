from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from app.core.config import settings


def _client_ip(request: Request) -> str:
    # Behind a trusted proxy, the real client IP is the first X-Forwarded-For entry.
    if settings.trust_proxy:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return get_remote_address(request)


# In-memory by default; set RATE_LIMIT_STORAGE_URI to a redis:// URL for multi-worker deploys.
limiter = Limiter(
    key_func=_client_ip,
    default_limits=["200/minute"],
    storage_uri=settings.rate_limit_storage_uri,
)
