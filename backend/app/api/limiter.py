import time
import logging
from fastapi import HTTPException, Request
from typing import Dict, Tuple, Optional
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self, requests_limit: int, window_seconds: int, resource_name: str = "default"):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.resource_name = resource_name
        
        # In-memory fallback
        self.clients: Dict[str, Tuple[int, float]] = {}
        
        # Redis connection
        self.redis_client: Optional[redis.Redis] = None
        try:
            if settings.REDIS_URL:
                self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
                self.redis_client.ping()
                logger.info(f"RateLimiter: Redis connected for {resource_name}")
        except Exception as e:
            logger.warning(f"RateLimiter: Redis connection failed, falling back to in-memory. Error: {e}")
            self.redis_client = None

    async def __call__(self, request: Request):
        # Use X-Forwarded-For if behind a proxy, otherwise client host
        client_ip = request.headers.get("X-Forwarded-For", request.client.host)
        key = f"rate_limit:{self.resource_name}:{client_ip}"
        
        if self.redis_client:
            return self._check_redis_limit(key)
        else:
            return self._check_memory_limit(client_ip)

    def _check_redis_limit(self, key: str):
        try:
            # Use Redis INCR and EXPIRE for atomic rate limiting
            current_count = self.redis_client.incr(key)
            if current_count == 1:
                self.redis_client.expire(key, self.window_seconds)
            
            if current_count > self.requests_limit:
                raise HTTPException(
                    status_code=429,
                    detail=f"Too many requests. Limit is {self.requests_limit} per {self.window_seconds}s."
                )
        except redis.RedisError as e:
            logger.error(f"Redis error in rate limiter: {e}")
            # Fallback to allow request if Redis fails in prod? 
            # Or fallback to memory? Let's just allow it to prevent total outage.
            return

    def _check_memory_limit(self, client_ip: str):
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
# 10 scans per 60 seconds
scan_limiter = RateLimiter(requests_limit=10, window_seconds=60, resource_name="scans")
# 20 auth attempts per 60 seconds
auth_limiter = RateLimiter(requests_limit=20, window_seconds=60, resource_name="auth")
