"""
Rate Limiting Infrastructure Module.

Provee protección contra ataques de fuerza bruta y DDoS.
"""

from .redis_client import redis_client, RedisClient
from .rate_limiter import rate_limiter, RateLimiter
from .decorators import rate_limit_login, rate_limit_otp, check_user_blocked, get_client_ip

__all__ = [
    "redis_client",
    "RedisClient", 
    "rate_limiter",
    "RateLimiter",
    "rate_limit_login",
    "rate_limit_otp",
    "check_user_blocked",
    "get_client_ip"
]
