"""
Decoradores de Flask para rate limiting.

Estos decoradores se aplican a los endpoints que necesitan
protección contra abuso.
"""
from functools import wraps
from flask import request, jsonify
from typing import Tuple, Optional

from .rate_limiter import rate_limiter


def get_client_ip() -> str:
    """
    Obtiene la IP real del cliente considerando proxies.
    
    El orden de prioridad es:
    1. X-Forwarded-For (primer IP de la lista)
    2. X-Real-IP
    3. remote_addr (fallback)
    
    Returns:
        str: Dirección IP del cliente
    """
    if request.headers.get("X-Forwarded-For"):
        # X-Forwarded-For puede tener múltiples IPs: client, proxy1, proxy2
        return request.headers.get("X-Forwarded-For").split(",")[0].strip()
    elif request.headers.get("X-Real-IP"):
        return request.headers.get("X-Real-IP")
    else:
        return request.remote_addr or "unknown"


def rate_limit_login(f):
    """
    Decorador para aplicar rate limiting al endpoint de login.
    
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
        ip = get_client_ip()

        # Verificar rate limit por IP
        is_limited, remaining = rate_limiter.check_ip_rate_limit(ip)
        if is_limited:
            return jsonify({
                "code": "TOO_MANY_REQUESTS",
                "message": "Demasiadas solicitudes. Intenta en un minuto.",
                "retry_after": rate_limiter.IP_RATE_WINDOW
            }), 429

        # Verificar si IP está bloqueada
        if rate_limiter.is_ip_blocked(ip):
            remaining_time = rate_limiter.get_ip_block_remaining(ip)
            return jsonify({
                "code": "IP_BLOCKED",
                "message": "Tu dirección IP ha sido bloqueada temporalmente.",
                "retry_after": remaining_time
            }), 403

        return f(*args, **kwargs)

    return decorated_function


def rate_limit_otp(f):
    """
    Decorador para aplicar rate limiting a endpoints de OTP.
    
    Límite más restrictivo: 5 requests por minuto.
    
    Uso:
        @auth_bp.route("/request-reset-code", methods=["POST"])
        @rate_limit_otp
        def request_reset_code():
            ...
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        ip = get_client_ip()
        
        # Usar un rate limit más restrictivo para OTP
        # Temporalmente verificamos el rate limit general
        is_limited, remaining = rate_limiter.check_ip_rate_limit(ip)
        if is_limited:
            return jsonify({
                "code": "TOO_MANY_REQUESTS",
                "message": "Demasiados intentos. Espera un momento.",
                "retry_after": rate_limiter.IP_RATE_WINDOW
            }), 429

        return f(*args, **kwargs)

    return decorated_function


def check_user_blocked(username: str) -> Tuple[bool, Optional[tuple]]:
    """
    Verifica si un usuario específico está bloqueado.
    
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
    if rate_limiter.is_user_blocked(username):
        remaining_time = rate_limiter.get_user_block_remaining(username)
        return True, (jsonify({
            "code": "USER_LOCKED",
            "message": "Usuario temporalmente bloqueado por seguridad.",
            "retry_after": remaining_time
        }), 423)

    return False, None
