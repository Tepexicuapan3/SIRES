# src/infrastructure/security/jwt_service.py
"""
JWT Service usando Flask-JWT-Extended

MIGRACIÓN COMPLETA de PyJWT a Flask-JWT-Extended para resolver conflictos
con cookies HttpOnly y CSRF protection.

Este módulo provee funciones wrapper sobre Flask-JWT-Extended para mantener
compatibilidad con el código existente mientras aprovecha todas las features
de cookies seguras, CSRF tokens, y refresh automático.
"""

import os
from datetime import timedelta
from flask_jwt_extended import create_access_token, create_refresh_token


# Configuración de tiempos de expiración (en segundos)
ACCESS_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 60*30))   # 30 min
RESET_EXPIRES = int(os.getenv("JWT_RESET_EXPIRES", 60*5))           # 5 min
ONBOARDING_EXPIRES = int(os.getenv("JWT_ONBOARDING_EXPIRES", 60*10)) # 10 min
REFRESH_EXPIRES = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", 60*60*24*7))  # 7 días


def generate_access_token(user_payload: dict, scope: str = "full_access", expires_seconds: int = None) -> str:
    """
    Genera un access token usando Flask-JWT-Extended.
    
    Args:
        user_payload: Dict con datos del usuario (debe incluir id_usuario, usuario, etc.)
        scope: Alcance del token ("full_access", "onboarding", "password_reset")
        expires_seconds: Tiempo de expiración en segundos (opcional, usa defaults según scope)
    
    Returns:
        str: Access token JWT firmado y compatible con Flask-JWT-Extended
    
    IMPORTANTE: 
        - El token incluye automáticamente claims CSRF cuando JWT_COOKIE_CSRF_PROTECT=True
        - identity debe ser string para Flask-JWT-Extended
        - additional_claims se usan para datos custom (scope, username, etc.)
    """
    
    # Determinar tiempo de expiración según scope
    if expires_seconds is None:
        if scope == "password_reset":
            expires_seconds = RESET_EXPIRES
        elif scope == "onboarding" or scope == "pre_auth_onboarding":
            expires_seconds = ONBOARDING_EXPIRES
        else:
            expires_seconds = ACCESS_EXPIRES
    
    # Identity debe ser string (Flask-JWT-Extended requirement)
    identity = str(user_payload.get("id_usuario"))
    
    # Additional claims: datos extra que van en el payload del JWT
    additional_claims = {
        "scope": scope,
        "username": user_payload.get("usuario"),
        # Opcionalmente puedes agregar más datos aquí
        # "nombre": user_payload.get("nombre"),
        # "roles": user_payload.get("roles", [])
    }
    
    # Crear token con Flask-JWT-Extended
    # Esta función automáticamente:
    # - Firma el token con JWT_SECRET_KEY
    # - Agrega claims estándar (iat, exp, jti, etc.)
    # - Agrega claim CSRF si JWT_COOKIE_CSRF_PROTECT=True
    # - Usa el algoritmo configurado (default HS256)
    token = create_access_token(
        identity=identity,
        additional_claims=additional_claims,
        expires_delta=timedelta(seconds=expires_seconds)
    )
    
    return token


def generate_refresh_token(user_payload: dict) -> str:
    """
    Genera un refresh token usando Flask-JWT-Extended.
    
    Args:
        user_payload: Dict con datos del usuario (debe incluir id_usuario, usuario)
    
    Returns:
        str: Refresh token JWT firmado
    
    IMPORTANTE:
        - Los refresh tokens tienen vida más larga (7 días por default)
        - Solo deben usarse para obtener nuevos access tokens
        - No deberían usarse para acceder a recursos protegidos
    """
    
    # Identity debe ser string
    identity = str(user_payload.get("id_usuario"))
    
    # Additional claims para refresh token
    additional_claims = {
        "scope": "refresh",
        "username": user_payload.get("usuario")
    }
    
    # Crear refresh token
    token = create_refresh_token(
        identity=identity,
        additional_claims=additional_claims,
        expires_delta=timedelta(seconds=REFRESH_EXPIRES)
    )
    
    return token


def decode_token(token: str):
    """
    Decodifica un JWT token.
    
    DEPRECADO: Esta función ya no es necesaria cuando usas Flask-JWT-Extended.
    En su lugar, usa los decoradores @jwt_required() y funciones get_jwt(), get_jwt_identity()
    
    Args:
        token: Token JWT a decodificar
    
    Returns:
        dict | None: Payload del token si es válido, None si es inválido/expirado
    
    NOTA: Esta función se mantiene por compatibilidad con código legacy,
    pero NO debería usarse en código nuevo. Usa los decoradores de Flask-JWT-Extended.
    """
    try:
        from flask_jwt_extended import decode_token as jwt_decode
        payload = jwt_decode(token)
        
        # Convertir formato Flask-JWT-Extended a formato legacy esperado
        # Flask-JWT-Extended usa "sub" en lugar de "id_usuario"
        legacy_payload = {
            "id_usuario": int(payload.get("sub")),
            "username": payload.get("username"),
            "scope": payload.get("scope"),
            "exp": payload.get("exp"),
            "iat": payload.get("iat")
        }
        
        return legacy_payload
        
    except Exception as e:
        print(f"Error decodificando token: {e}")
        return None


# ============================================================================
# CÓDIGO LEGACY COMENTADO (NO BORRAR - REFERENCIA)
# ============================================================================
"""
VERSIÓN ANTERIOR usando PyJWT directo:

import jwt
from datetime import datetime, timezone

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "dev-secret")
JWT_ALGO = os.getenv("JWT_ALGORITHM", "HS256")

def _now_ts():
    return datetime.now(timezone.utc)

def generate_access_token(user_payload: dict, scope: str = "full_access", expires_seconds: int = None) -> str:
    if expires_seconds is None:
        if scope == "password_reset":
            expires_seconds = RESET_EXPIRES
        elif scope == "pre_auth_onboarding": 
            expires_seconds = PREAUTH_EXPIRES
        else:
            expires_seconds = ACCESS_EXPIRES

    iat = _now_ts()
    exp = iat + timedelta(seconds=expires_seconds)
    payload = {
        "sub": str(user_payload.get("id_usuario")),
        "username": user_payload.get("usuario"),
        "scope": scope,
        "iat": int(iat.timestamp()),
        "exp": int(exp.timestamp())
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)
    
    if isinstance(token, bytes):
        token = token.decode()
    return token

PROBLEMA: 
- PyJWT directo no genera claims CSRF automáticamente
- No está integrado con el sistema de cookies de Flask
- Requiere manejo manual de todos los claims
- No aprovecha features de Flask-JWT-Extended (revocation, fresh tokens, etc.)

SOLUCIÓN:
- Migrar completamente a Flask-JWT-Extended
- Mantener misma interfaz de funciones (generate_access_token, etc.)
- Aprovechar protección CSRF automática
- Cookies HttpOnly configuradas centralmente en __init__.py
"""
