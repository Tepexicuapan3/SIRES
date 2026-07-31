"""
apps/portal_citas/services/otp_service.py
============================================
Generación, hasheo y verificación de códigos OTP del portal de citas en
línea.

El código en sí nunca se guarda en texto plano — solo su hash HMAC-SHA256
en ``PortalOTP.codigo_hash``. Un HMAC simple (rápido) es suficiente aquí:
el OTP ya tiene expiración corta + límite de intentos, que acotan un
ataque de fuerza bruta; no hace falta un hasher lento tipo PBKDF2.
"""

import hashlib
import hmac
import secrets
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

OTP_LENGTH = 6
OTP_TTL_MINUTES = 10
OTP_MAX_ATTEMPTS = 5


def generate_code() -> str:
    # 6 dígitos generados con secrets (CSPRNG) — nunca random.
    return "".join(str(secrets.randbelow(10)) for _ in range(OTP_LENGTH))


def hash_code(code: str) -> str:
    return hmac.new(
        settings.SECRET_KEY.encode(),
        code.encode(),
        hashlib.sha256,
    ).hexdigest()


def verify_code(code: str, codigo_hash: str) -> bool:
    # Comparación en tiempo constante para evitar timing attacks.
    return hmac.compare_digest(hash_code(code), codigo_hash)


def nueva_expiracion():
    return timezone.now() + timedelta(minutes=OTP_TTL_MINUTES)
