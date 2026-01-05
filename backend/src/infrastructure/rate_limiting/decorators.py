"""
Decoradores de Flask para rate limiting.

Estos decoradores se aplican a los endpoints que necesitan
protección contra abuso.
"""
from functools import wraps
from flask import request, jsonify  # type: ignore
from typing import Tuple, Optional

from .rate_limiter import rate_limiter


def get_client_ip() -> str:
    """
    Obtiene la IP del cliente.

    IMPORTANTE: NO confiar ciegamente en headers tipo X-Forwarded-For.
    Esos headers son triviales de falsificar desde internet.

    Regla:
    - Solo confiamos en X-Forwarded-For / X-Real-IP si la request viene de un
      proxy "trusted" (allowlist configurable via env TRUSTED_PROXIES).
    - Si no, usamos request.remote_addr.
    """

    remote_addr = request.remote_addr or "unknown"

    # Allowlist de proxies confiables (IPs exactas)
    # Ej: TRUSTED_PROXIES=127.0.0.1,172.18.0.1
    import os
    raw = os.getenv("TRUSTED_PROXIES", "")
    trusted = {ip.strip() for ip in raw.split(",") if ip.strip()}

    # Si no hay proxies declarados, no confiamos en headers.
    if not trusted or remote_addr not in trusted:
        return remote_addr

    # Ya estamos detras de un proxy confiable: ahora si podemos leer headers.
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        # Puede venir: client, proxy1, proxy2
        return xff.split(",")[0].strip()

    xri = request.headers.get("X-Real-IP")
    if xri:
        return xri.strip()

    return remote_addr


def rate_limit_login(f):
    """
    Decorador para aplicar rate limiting al endpoint de login.
    
    ⚠️ TEMPORALMENTE DESHABILITADO - Redis no disponible
    
    Verifica:
    1. Rate limit por IP (sliding window de 1 minuto)
    2. Si la IP está bloqueada por intentos fallidos
    
    Uso:
        @auth_bp.route("/login", methods=["POST"])
        @rate_limit_login
        def login():
            ...
    
    Responses:
        429: Rate limit excedido (TOO_MANY_REQUESTS)
        403: IP bloqueada (IP_BLOCKED)
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # COMENTADO TEMP - Redis connection issue
        # ip = get_client_ip()

        # # Verificar rate limit por IP
        # is_limited, remaining = rate_limiter.check_ip_rate_limit(ip)
        # if is_limited:
        #     return jsonify({
        #         "code": "TOO_MANY_REQUESTS",
        #         "message": "Demasiadas solicitudes. Intenta en un minuto.",
        #         "retry_after": rate_limiter.IP_RATE_WINDOW
        #     }), 429

        # # Verificar si IP está bloqueada
        # if rate_limiter.is_ip_blocked(ip):
        #     remaining_time = rate_limiter.get_ip_block_remaining(ip)
        #     return jsonify({
        #         "code": "IP_BLOCKED",
        #         "message": "Tu dirección IP ha sido bloqueada temporalmente.",
        #         "retry_after": remaining_time
        #     }), 403

        return f(*args, **kwargs)

    return decorated_function


def rate_limit_otp(f):
    """
    Decorador para aplicar rate limiting a endpoints de OTP.
    
    ⚠️ TEMPORALMENTE DESHABILITADO - Redis no disponible
    
    Límite más restrictivo: 5 requests por minuto.
    
    Uso:
        @auth_bp.route("/request-reset-code", methods=["POST"])
        @rate_limit_otp
        def request_reset_code():
            ...
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # COMENTADO TEMP - Redis connection issue
        # ip = get_client_ip()
        
        # # Rate limit independiente para OTP/recovery (NO mezclar con login)
        # is_limited, remaining = rate_limiter.check_ip_rate_limit_otp(ip)
        # if is_limited:
        #     return jsonify({
        #         "code": "TOO_MANY_REQUESTS",
        #         "message": "Demasiados intentos. Espera un momento.",
        #         "retry_after": rate_limiter.OTP_RATE_WINDOW
        #     }), 429

        return f(*args, **kwargs)

    return decorated_function


def check_user_blocked(username: str) -> Tuple[bool, Optional[tuple]]:
    """
    Verifica si un usuario específico está bloqueado.
    
    ⚠️ TEMPORALMENTE DESHABILITADO - Redis no disponible
    
    Esta función se usa dentro del endpoint (no como decorador)
    porque necesita acceso al username del body.
    
    Args:
        username: Nombre de usuario a verificar
        
    Returns:
        Tuple[bool, Optional[tuple]]: (is_blocked, (response, status_code))
        
    Uso:
        blocked, response = check_user_blocked(username)
        if blocked:
            return response
    """
    # COMENTADO TEMP - Redis connection issue
    # if rate_limiter.is_user_blocked(username):
    #     remaining_time = rate_limiter.get_user_block_remaining(username)
    #     return True, (jsonify({
    #         "code": "USER_LOCKED",
    #         "message": "Usuario temporalmente bloqueado por seguridad.",
    #         "retry_after": remaining_time
    #     }), 423)

    return False, None
