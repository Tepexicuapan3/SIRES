"""
RedisManager - Wrapper para operaciones de cache en Redis.

Este manager proporciona métodos de alto nivel para cache de permisos
y otras operaciones que requieren invalidación de cache.
"""
from typing import Optional, Any
from src.infrastructure.rate_limiting.redis_client import redis_client


class RedisManager:
    """
    Manager de Redis para operaciones de cache.
    
    Uso:
        from src.infrastructure.cache.redis_manager import RedisManager
        
        redis = RedisManager()
        redis.set("key", "value", ttl=300)
        value = redis.get("key")
        redis.delete_pattern("user_permissions:*")
    """
    
    def __init__(self):
        self.client = redis_client
    
    def get(self, key: str) -> Optional[str]:
        """
        Obtiene un valor de Redis.
        
        Args:
            key: Clave a buscar
            
        Returns:
            Valor almacenado o None si no existe
        """
        try:
            return self.client.get(key)
        except Exception as e:
            print(f"[Redis] Error getting key {key}: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Guarda un valor en Redis.
        
        Args:
            key: Clave
            value: Valor a guardar
            ttl: Tiempo de expiración en segundos (opcional)
            
        Returns:
            True si se guardó correctamente
        """
        try:
            if ttl:
                self.client.setex(key, ttl, value)
            else:
                self.client.set(key, value)
            return True
        except Exception as e:
            print(f"[Redis] Error setting key {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """
        Elimina una clave de Redis.
        
        Args:
            key: Clave a eliminar
            
        Returns:
            True si se eliminó
        """
        try:
            self.client.delete(key)
            return True
        except Exception as e:
            print(f"[Redis] Error deleting key {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """
        Elimina todas las claves que coincidan con un patrón.
        
        Args:
            pattern: Patrón de búsqueda (ej: "user_permissions:*")
            
        Returns:
            Número de claves eliminadas
        """
        try:
            keys = self.client.keys(pattern)
            if keys:
                return self.client.delete(*keys)
            return 0
        except Exception as e:
            print(f"[Redis] Error deleting pattern {pattern}: {e}")
            return 0
    
    def exists(self, key: str) -> bool:
        """
        Verifica si una clave existe.
        
        Args:
            key: Clave a verificar
            
        Returns:
            True si existe
        """
        try:
            return self.client.exists(key) == 1
        except Exception as e:
            print(f"[Redis] Error checking key {key}: {e}")
            return False
