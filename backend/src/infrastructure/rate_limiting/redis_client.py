"""
Conexión centralizada a Redis para rate limiting y OTP.

Esta clase implementa el patrón Singleton para mantener una única
conexión a Redis en toda la aplicación.
"""
import os
import redis
from typing import Optional


class RedisClient:
    """
    Cliente Redis singleton.
    
    Uso:
        from src.infrastructure.rate_limiting.redis_client import redis_client
        redis_client.get("key")
        redis_client.set("key", "value")
    """
    _instance: Optional[redis.Redis] = None

    @classmethod
    def get_instance(cls) -> redis.Redis:
        """
        Obtiene o crea la instancia única de Redis.
        
        Configuración vía variables de entorno:
        - REDIS_HOST: Host del servidor (default: redis)
        - REDIS_PORT: Puerto (default: 6379)
        - REDIS_DB: Base de datos (default: 0)
        """
        if cls._instance is None:
            cls._instance = redis.Redis(
                host=os.getenv("REDIS_HOST", "redis"),
                port=int(os.getenv("REDIS_PORT", 6379)),
                db=int(os.getenv("REDIS_DB", 0)),
                decode_responses=True,  # Retorna strings en vez de bytes
                socket_timeout=5,
                socket_connect_timeout=5,
                retry_on_timeout=True
            )
        return cls._instance

    @classmethod
    def health_check(cls) -> bool:
        """
        Verifica si Redis está disponible.
        
        Returns:
            bool: True si Redis responde al ping, False en caso contrario.
        """
        try:
            return cls.get_instance().ping()
        except redis.ConnectionError:
            return False

    @classmethod
    def reset_instance(cls) -> None:
        """
        Resetea la instancia (útil para testing).
        """
        cls._instance = None


# Singleton para importar directamente
redis_client = RedisClient.get_instance()
