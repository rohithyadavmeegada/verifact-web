"""
VeriFact Backend — Rate Limiting Middleware
Production sliding-window rate limiter protecting API endpoints from abuse.
"""

from __future__ import annotations

import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings

settings = get_settings()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    In-memory sliding window rate limiter.
    Limits requests per client IP address.
    """

    def __init__(self, app, max_requests: int = 120, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[float]] = defaultdict(list)
        self.last_cleanup = time.time()

    def _cleanup_old_entries(self, now: float):
        """Periodically clean up stale client entries to avoid unbounded memory."""
        if now - self.last_cleanup > 300:  # Every 5 minutes
            cutoff = now - self.window_seconds
            empty_keys = []
            for ip, timestamps in self.requests.items():
                self.requests[ip] = [ts for ts in timestamps if ts > cutoff]
                if not self.requests[ip]:
                    empty_keys.append(ip)
            for k in empty_keys:
                del self.requests[k]
            self.last_cleanup = now

    async def dispatch(self, request: Request, call_next) -> Response:
        # Exempt health checks, docs, and schema definitions
        exempt_paths = [
            "/api/health",
            "/api/ready",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/docs",
        ]
        if any(request.url.path.startswith(p) for p in exempt_paths):
            return await call_next(request)

        # Extract client IP (handling reverse proxy headers)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"

        now = time.time()
        self._cleanup_old_entries(now)

        cutoff = now - self.window_seconds
        timestamps = [ts for ts in self.requests[client_ip] if ts > cutoff]

        if len(timestamps) >= self.max_requests:
            retry_after = int(self.window_seconds - (now - timestamps[0])) + 1
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "detail": f"Too many requests. Limit is {self.max_requests} requests per minute.",
                    "retry_after_seconds": max(1, retry_after),
                },
                headers={"Retry-After": str(max(1, retry_after))},
            )

        timestamps.append(now)
        self.requests[client_ip] = timestamps

        response = await call_next(request)
        remaining = max(0, self.max_requests - len(timestamps))
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
