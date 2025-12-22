"""
Servicio de códigos OTP para recuperación de contraseña.

MIGRADO A REDIS: Este servicio ahora usa Redis en lugar de un 
diccionario en memoria, lo que provee:
- Persistencia: Los códigos sobreviven reinicios del servidor
- Escalabilidad: Funciona con múltiples instancias del backend
- TTL automático: Redis maneja la expiración

Reglas de negocio:
- Código de 6 dígitos
- Expira en 10 minutos
- Máximo 3 intentos incorrectos (al 3ro se invalida)
- Un solo uso (se elimina tras verificación exitosa)
"""
import random
import json
from typing import Tuple, Optional

from src.infrastructure.rate_limiting.redis_client import redis_client


class OTPService:
    """
    Servicio de OTP con almacenamiento en Redis.
    
    Uso:
        from src.use_cases.auth.otp_service import OTPService
        
        # Generar y guardar código
        code = OTPService.generate_code()
        OTPService.save_code(email, code)
        
        # Verificar código
        is_valid, message, error_code = OTPService.verify_code(email, code)
    """

    PREFIX = "otp:"
    TTL = 600  # 10 minutos en segundos
    MAX_ATTEMPTS = 3

    @staticmethod
    def generate_code() -> str:
        """
        Genera un código OTP de 6 dígitos.
        
        Returns:
            str: Código de 6 dígitos (ej: "123456")
        """
        return str(random.randint(100000, 999999))

    @staticmethod
    def save_code(email: str, code: str) -> None:
        """
        Guarda un código OTP en Redis.
        
        Si ya existe un código para este email, se reemplaza.
        Esto invalida cualquier código anterior automáticamente.
        
        Args:
            email: Email del usuario (se normaliza a minúsculas)
            code: Código OTP de 6 dígitos
        """
        key = f"{OTPService.PREFIX}{email.lower()}"
        data = json.dumps({
            "code": code,
            "attempts": 0
        })
        redis_client.setex(key, OTPService.TTL, data)

    @staticmethod
    def verify_code(email: str, code: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Verifica un código OTP.
        
        Flujo:
        1. Si no existe o expiró -> CODE_EXPIRED
        2. Si ya se agotaron los intentos -> CODE_EXPIRED
        3. Si el código no coincide -> INVALID_CODE + incrementa intentos
        4. Si el código coincide -> SUCCESS + elimina OTP
        
        Args:
            email: Email del usuario
            code: Código ingresado por el usuario
            
        Returns:
            Tuple[bool, Optional[str], Optional[str]]:
            - (True, None, None) si es válido
            - (False, message, error_code) si hay error
        """
        key = f"{OTPService.PREFIX}{email.lower()}"
        raw = redis_client.get(key)

        # Código no existe o expiró
        if not raw:
            return False, "El código ha expirado o no existe", "CODE_EXPIRED"

        data = json.loads(raw)

        # Ya se agotaron los intentos
        if data["attempts"] >= OTPService.MAX_ATTEMPTS:
            # Eliminar el código invalidado
            redis_client.delete(key)
            return False, "Código invalidado por demasiados intentos", "CODE_EXPIRED"

        # Código incorrecto
        if data["code"] != code:
            data["attempts"] += 1
            remaining_attempts = OTPService.MAX_ATTEMPTS - data["attempts"]
            
            # ¿Es el último intento fallido?
            if data["attempts"] >= OTPService.MAX_ATTEMPTS:
                # Eliminar - código invalidado
                redis_client.delete(key)
                print(f"[SECURITY] OTP invalidado por intentos: email={email}")
                return False, "Código invalidado por demasiados intentos", "CODE_EXPIRED"
            
            # Actualizar contador manteniendo el TTL restante
            ttl = redis_client.ttl(key)
            if ttl > 0:
                redis_client.setex(key, ttl, json.dumps(data))
            
            return False, f"Código incorrecto. Intentos restantes: {remaining_attempts}", "INVALID_CODE"

        # Código correcto - eliminar y retornar éxito
        redis_client.delete(key)
        return True, None, None

    @staticmethod
    def invalidate_code(email: str) -> bool:
        """
        Invalida manualmente un código OTP.
        
        Útil cuando el usuario cambia la contraseña por otro medio
        o cuando se quiere forzar la regeneración.
        
        Args:
            email: Email del usuario
            
        Returns:
            bool: True si había un código que invalidar
        """
        key = f"{OTPService.PREFIX}{email.lower()}"
        return redis_client.delete(key) > 0

    @staticmethod
    def get_remaining_attempts(email: str) -> Optional[int]:
        """
        Obtiene los intentos restantes para un código.
        
        Args:
            email: Email del usuario
            
        Returns:
            int: Intentos restantes (0-3)
            None: Si no existe código
        """
        key = f"{OTPService.PREFIX}{email.lower()}"
        raw = redis_client.get(key)
        
        if not raw:
            return None
            
        data = json.loads(raw)
        return OTPService.MAX_ATTEMPTS - data["attempts"]

    @staticmethod
    def code_exists(email: str) -> bool:
        """
        Verifica si existe un código OTP para el email.
        
        Args:
            email: Email del usuario
            
        Returns:
            bool: True si existe un código activo
        """
        key = f"{OTPService.PREFIX}{email.lower()}"
        return redis_client.exists(key) == 1
