from __future__ import annotations

from collections import defaultdict
from threading import Lock

from django.core.cache import cache

from apps.authentication.services.errors import PolicyStoreUnavailableError

_atomic_locks: dict[str, Lock] = defaultdict(Lock)


class PolicyStore:
    def increment_counter(self, key: str, ttl_seconds: int) -> int:
        try:
            current = cache.get(key)
            if current is None:
                cache.set(key, 1, ttl_seconds)
                return 1

            value = int(current) + 1
            cache.set(key, value, ttl_seconds)
            return value
        except Exception as exc:
            raise PolicyStoreUnavailableError("Policy store unavailable") from exc

    def get_counter(self, key: str) -> int:
        try:
            return int(cache.get(key, 0) or 0)
        except Exception as exc:
            raise PolicyStoreUnavailableError("Policy store unavailable") from exc

    def clear_counter(self, key: str) -> None:
        try:
            cache.delete(key)
        except Exception as exc:
            raise PolicyStoreUnavailableError("Policy store unavailable") from exc

    def set_lock(self, key: str, ttl_seconds: int) -> None:
        try:
            cache.set(key, 1, ttl_seconds)
        except Exception as exc:
            raise PolicyStoreUnavailableError("Policy store unavailable") from exc

    def is_locked(self, key: str) -> bool:
        try:
            return bool(cache.get(key))
        except Exception as exc:
            raise PolicyStoreUnavailableError("Policy store unavailable") from exc

    def set_otp(self, email: str, code: str, ttl_seconds: int) -> None:
        key = self._otp_key(email)
        try:
            cache.set(key, code, ttl_seconds)
        except Exception as exc:
            raise PolicyStoreUnavailableError("Policy store unavailable") from exc

    def get_otp(self, email: str) -> str | None:
        key = self._otp_key(email)
        try:
            return cache.get(key)
        except Exception as exc:
            raise PolicyStoreUnavailableError("Policy store unavailable") from exc

    def delete_otp(self, email: str) -> None:
        key = self._otp_key(email)
        try:
            cache.delete(key)
        except Exception as exc:
            raise PolicyStoreUnavailableError("Policy store unavailable") from exc

    def consume_otp(self, email: str, expected_code: str) -> bool:
        key = self._otp_key(email)
        try:
            redis_result = self._consume_otp_with_redis_lua(key, expected_code)
            if redis_result is not None:
                return redis_result

            lock = _atomic_locks[key]
            with lock:
                stored = cache.get(key)
                if not stored or stored != expected_code:
                    return False
                cache.delete(key)
                return True
        except Exception as exc:
            raise PolicyStoreUnavailableError("Policy store unavailable") from exc

    @staticmethod
    def _otp_key(email: str) -> str:
        return f"otp:{email.lower()}"

    @staticmethod
    def _consume_otp_with_redis_lua(key: str, expected_code: str) -> bool | None:
        cache_client = getattr(cache, "client", None)
        if not cache_client or not hasattr(cache_client, "get_client"):
            return None

        raw_client = cache_client.get_client(write=True)
        redis_key = cache.make_key(key) if hasattr(cache, "make_key") else key
        script = """
        local stored = redis.call('GET', KEYS[1])
        if not stored then
            return 0
        end
        if stored ~= ARGV[1] then
            return 0
        end
        redis.call('DEL', KEYS[1])
        return 1
        """
        result = raw_client.eval(script, 1, redis_key, expected_code)
        return int(result) == 1
