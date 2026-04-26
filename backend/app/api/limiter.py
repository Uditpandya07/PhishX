import time
from fastapi import HTTPException, Request
from typing import Dict, Tuple

class RateLimiter:
    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        # Dictionary to store (request_count, window_start_time) for each IP
        self.clients: Dict[str, Tuple[int, float]] = {}

    async def __call__(self, request: Request):
        # In production behind a proxy, use request.headers.get("X-Forwarded-For")
        client_ip = request.client.host
        now = time.time()

        if client_ip not in self.clients:
            self.clients[client_ip] = (1, now)
            return

        count, first_request_time = self.clients[client_ip]

        # Reset window if time has passed
        if now - first_request_time > self.window_seconds:
            self.clients[client_ip] = (1, now)
            return

        # Check limit
        if count >= self.requests_limit:
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Limit is {self.requests_limit} per {self.window_seconds}s."
            )

        # Increment count
        self.clients[client_ip] = (count + 1, first_request_time)

# Pre-defined limiters
# 5 scans per 60 seconds for free users
scan_limiter = RateLimiter(requests_limit=10, window_seconds=60)
# 20 auth attempts per 60 seconds
auth_limiter = RateLimiter(requests_limit=20, window_seconds=60)
