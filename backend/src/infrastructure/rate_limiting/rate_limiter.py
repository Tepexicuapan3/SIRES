"""
Servicio de Rate Limiting con Redis.

Estrategia de protección en 3 niveles:
1. Rate limit por IP (sliding window) - Previene flood de requests
2. Bloqueo por IP (intentos fallidos) - Previene ataques distribuidos
3. Bloqueo por Usuario (intentos fallidos) - Previene ataques dirigidos

La configuración se puede ajustar mediante variables de entorno o
modificando las constantes de clase.
"""
import os
import time
from typing import Tuple

from .redis_client import redis_client


class RateLimiter:
    """
    Servicio principal de rate limiting.
    
    Uso:
        from src.infrastructure.rate_limiting import rate_limiter
        
        # Verificar si IP puede hacer request
        if rate_limiter.is_ip_rate_limited(ip):
            return 429
        
        # Registrar intento fallido
        rate_limiter.record_failed_attempt(ip, username)
        
        # Resetear tras login exitoso
        rate_limiter.reset_user_attempts(username)
    """

    # =====================================================
    # CONFIGURACION - Ajustar según necesidades
    # =====================================================

    # Rate limiting por IP (requests por minuto)
    IP_RATE_LIMIT = int(os.getenv("RATE_LIMIT_LOGIN_PER_MINUTE", 10))
    IP_RATE_WINDOW = 60  # Ventana en segundos (1 minuto)

    # Bloqueo por IP (intentos fallidos)
    IP_BLOCK_THRESHOLDS = [
        (15, 15 * 60),       # 15 fallos -> bloqueo 15 minutos
        (30, 60 * 60),       # 30 fallos -> bloqueo 1 hora
        (50, 24 * 60 * 60),  # 50 fallos -> bloqueo 24 horas
    ]
    IP_FAILED_TTL = 24 * 60 * 60  # TTL del contador de fallos (24h)

    # Bloqueo por Usuario (intentos fallidos)
    USER_BLOCK_THRESHOLDS = [
        (5, 5 * 60),         # 5 fallos -> bloqueo 5 minutos
        (10, 15 * 60),       # 10 fallos -> bloqueo 15 minutos
        (15, 60 * 60),       # 15 fallos -> bloqueo 1 hora
        (20, 24 * 60 * 60),  # 20 fallos -> bloqueo 24 horas
    ]
    USER_FAILED_TTL = 24 * 60 * 60  # TTL del contador de fallos (24h)

    # Prefijos de keys en Redis
    PREFIX_IP_RATE = "rate:ip:"
    PREFIX_IP_FAILED = "failed:ip:"
    PREFIX_IP_BLOCK = "block:ip:"
    PREFIX_USER_FAILED = "failed:user:"
    PREFIX_USER_BLOCK = "block:user:"

    # =====================================================
    # RATE LIMITING POR IP (Sliding Window)
    # =====================================================

    def check_ip_rate_limit(self, ip: str) -> Tuple[bool, int]:
        """
        Verifica si una IP ha excedido el rate limit usando sliding window.
        
        El sliding window funciona así:
        - Guardamos el timestamp de cada request en un sorted set
        - Eliminamos los timestamps fuera de la ventana
        - Contamos cuántos quedan
        
        Args:
            ip: Dirección IP del cliente
            
        Returns:
            Tuple[bool, int]: (is_limited, remaining_requests)
        """
        key = f"{self.PREFIX_IP_RATE}{ip}"
        now = time.time()
        window_start = now - self.IP_RATE_WINDOW

        pipe = redis_client.pipeline()

        # Eliminar requests fuera de la ventana
        pipe.zremrangebyscore(key, 0, window_start)

        # Contar requests en la ventana actual
        pipe.zcard(key)

        # Agregar el request actual
        pipe.zadd(key, {str(now): now})

        # Establecer TTL para limpieza automática
        pipe.expire(key, self.IP_RATE_WINDOW)

        results = pipe.execute()
        current_count = results[1]

        remaining = max(0, self.IP_RATE_LIMIT - current_count - 1)
        is_limited = current_count >= self.IP_RATE_LIMIT

        return is_limited, remaining

    def is_ip_rate_limited(self, ip: str) -> bool:
        """
        Shorthand para verificar si IP está rate limited.
        
        Args:
            ip: Dirección IP del cliente
            
        Returns:
            bool: True si la IP excedió el límite
        """
        is_limited, _ = self.check_ip_rate_limit(ip)
        return is_limited

    # =====================================================
    # BLOQUEO POR IP (Intentos Fallidos)
    # =====================================================

    def record_ip_failed_attempt(self, ip: str) -> int:
        """
        Registra un intento fallido desde una IP.
        
        Si la IP alcanza un threshold, se bloquea automáticamente.
        
        Args:
            ip: Dirección IP del cliente
            
        Returns:
            int: Número actual de intentos fallidos
        """
        key = f"{self.PREFIX_IP_FAILED}{ip}"

        pipe = redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, self.IP_FAILED_TTL)
        results = pipe.execute()

        attempts = results[0]

        # Verificar si debemos bloquear
        for threshold, block_duration in self.IP_BLOCK_THRESHOLDS:
            if attempts == threshold:
                self._block_ip(ip, block_duration)
                break

        return attempts

    def _block_ip(self, ip: str, duration: int) -> None:
        """
        Bloquea una IP por una duración específica.
        
        Args:
            ip: Dirección IP a bloquear
            duration: Duración del bloqueo en segundos
        """
        key = f"{self.PREFIX_IP_BLOCK}{ip}"
        redis_client.setex(key, duration, "blocked")

        # Log para auditoría
        print(f"[SECURITY] IP {ip} bloqueada por {duration}s")

    def is_ip_blocked(self, ip: str) -> bool:
        """
        Verifica si una IP está bloqueada.
        
        Args:
            ip: Dirección IP del cliente
            
        Returns:
            bool: True si la IP está bloqueada
        """
        key = f"{self.PREFIX_IP_BLOCK}{ip}"
        return redis_client.exists(key) == 1

    def get_ip_block_remaining(self, ip: str) -> int:
        """
        Obtiene segundos restantes de bloqueo para una IP.
        
        Args:
            ip: Dirección IP del cliente
            
        Returns:
            int: Segundos restantes (0 si no está bloqueada)
        """
        key = f"{self.PREFIX_IP_BLOCK}{ip}"
        ttl = redis_client.ttl(key)
        return max(0, ttl)

    # =====================================================
    # BLOQUEO POR USUARIO (Intentos Fallidos)
    # =====================================================

    def record_user_failed_attempt(self, username: str) -> int:
        """
        Registra un intento fallido para un usuario.
        
        Si el usuario alcanza un threshold, se bloquea automáticamente.
        
        Args:
            username: Nombre de usuario
            
        Returns:
            int: Número actual de intentos fallidos
        """
        key = f"{self.PREFIX_USER_FAILED}{username}"

        pipe = redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, self.USER_FAILED_TTL)
        results = pipe.execute()

        attempts = results[0]

        # Verificar si debemos bloquear
        for threshold, block_duration in self.USER_BLOCK_THRESHOLDS:
            if attempts == threshold:
                self._block_user(username, block_duration)
                break

        return attempts

    def _block_user(self, username: str, duration: int) -> None:
        """
        Bloquea un usuario por una duración específica.
        
        Args:
            username: Nombre de usuario a bloquear
            duration: Duración del bloqueo en segundos
        """
        key = f"{self.PREFIX_USER_BLOCK}{username}"
        redis_client.setex(key, duration, "blocked")

        # Log para auditoría
        print(f"[SECURITY] Usuario '{username}' bloqueado por {duration}s")

    def is_user_blocked(self, username: str) -> bool:
        """
        Verifica si un usuario está bloqueado.
        
        Args:
            username: Nombre de usuario
            
        Returns:
            bool: True si el usuario está bloqueado
        """
        key = f"{self.PREFIX_USER_BLOCK}{username}"
        return redis_client.exists(key) == 1

    def get_user_block_remaining(self, username: str) -> int:
        """
        Obtiene segundos restantes de bloqueo para un usuario.
        
        Args:
            username: Nombre de usuario
            
        Returns:
            int: Segundos restantes (0 si no está bloqueado)
        """
        key = f"{self.PREFIX_USER_BLOCK}{username}"
        ttl = redis_client.ttl(key)
        return max(0, ttl)

    # =====================================================
    # MÉTODOS COMBINADOS
    # =====================================================

    def record_failed_attempt(self, ip: str, username: str) -> dict:
        """
        Registra un intento fallido tanto por IP como por usuario.
        
        Este método se llama después de un login fallido para
        actualizar ambos contadores de forma atómica.
        
        Args:
            ip: Dirección IP del cliente
            username: Nombre de usuario
            
        Returns:
            dict: Estado actual de intentos y bloqueos
        """
        ip_attempts = self.record_ip_failed_attempt(ip)
        user_attempts = self.record_user_failed_attempt(username)

        return {
            "ip_attempts": ip_attempts,
            "ip_blocked": self.is_ip_blocked(ip),
            "user_attempts": user_attempts,
            "user_blocked": self.is_user_blocked(username)
        }

    def reset_user_attempts(self, username: str) -> None:
        """
        Resetea los intentos fallidos de un usuario tras login exitoso.
        
        IMPORTANTE: NO resetea el contador de IP. Un atacante podría
        adivinar una contraseña, y queremos mantener registro de los
        intentos previos desde esa IP.
        
        Args:
            username: Nombre de usuario
        """
        key = f"{self.PREFIX_USER_FAILED}{username}"
        redis_client.delete(key)

    def get_protection_status(self, ip: str, username: str) -> dict:
        """
        Obtiene el estado completo de protección para debug/admin.
        
        Args:
            ip: Dirección IP del cliente
            username: Nombre de usuario
            
        Returns:
            dict: Estado detallado de rate limiting y bloqueos
        """
        return {
            "ip": {
                "address": ip,
                "rate_limited": self.is_ip_rate_limited(ip),
                "blocked": self.is_ip_blocked(ip),
                "block_remaining": self.get_ip_block_remaining(ip),
                "failed_attempts": int(redis_client.get(
                    f"{self.PREFIX_IP_FAILED}{ip}") or 0)
            },
            "user": {
                "username": username,
                "blocked": self.is_user_blocked(username),
                "block_remaining": self.get_user_block_remaining(username),
                "failed_attempts": int(redis_client.get(
                    f"{self.PREFIX_USER_FAILED}{username}") or 0)
            }
        }


# Singleton para uso directo
rate_limiter = RateLimiter()
