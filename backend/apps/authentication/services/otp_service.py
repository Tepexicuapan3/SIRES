import secrets

from django.core.cache import cache

OTP_TTL_SECONDS = 60 * 10
OTP_ATTEMPT_LIMIT = 5
OTP_REQUEST_TTL_SECONDS = 60 * 10
OTP_REQUEST_LIMIT = 5


def generate_code():
    # Genera codigo de 6 digitos.
    return str(secrets.randbelow(10**6)).zfill(6)


def store_code(email, code):
    # Guarda codigo en cache con TTL.
    cache.set(_otp_key(email), {"code": code, "attempts": 0}, OTP_TTL_SECONDS)


def get_code(email):
    # Obtiene codigo desde cache.
    return cache.get(_otp_key(email))


def increment_attempts(email):
    # Incrementa intentos de validacion.
    data = cache.get(_otp_key(email))
    if not data:
        return None
    data["attempts"] = data.get("attempts", 0) + 1
    cache.set(_otp_key(email), data, OTP_TTL_SECONDS)
    return data


def clear_code(email):
    # Elimina el codigo de cache.
    cache.delete(_otp_key(email))


def rate_limit_request(email):
    # Limite de solicitudes por correo.
    key = _otp_request_key(email)
    count = cache.get(key, 0) + 1
    cache.set(key, count, OTP_REQUEST_TTL_SECONDS)
    return count > OTP_REQUEST_LIMIT


def _otp_key(email):
    return f"otp:{email.lower()}"


def _otp_request_key(email):
    return f"otp:req:{email.lower()}"
