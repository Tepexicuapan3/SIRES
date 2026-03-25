import secrets

from django.core.cache import cache

from apps.authentication.domain.auth_policy_rules import OTP_RULE, RESET_REQUEST_ACCOUNT
from apps.authentication.infrastructure.policy_store import PolicyStore

OTP_TTL_SECONDS = OTP_RULE.otp_ttl_seconds or 300
OTP_ATTEMPT_LIMIT = 5
OTP_REQUEST_TTL_SECONDS = RESET_REQUEST_ACCOUNT.window_seconds
OTP_REQUEST_LIMIT = RESET_REQUEST_ACCOUNT.threshold

policy_store = PolicyStore()


def generate_code():
    # Genera codigo de 6 digitos.
    return str(secrets.randbelow(10**6)).zfill(6)


def store_code(email, code):
    # Guarda codigo en cache con TTL.
    policy_store.set_otp(email, code, OTP_TTL_SECONDS)
    cache.set(_otp_attempts_key(email), 0, OTP_TTL_SECONDS)


def get_code(email):
    # Obtiene codigo desde cache.
    code = policy_store.get_otp(email)
    if not code:
        return None
    return {"code": code, "attempts": cache.get(_otp_attempts_key(email), 0)}


def increment_attempts(email):
    # Incrementa intentos de validacion.
    code = policy_store.get_otp(email)
    if not code:
        return None
    attempts = cache.get(_otp_attempts_key(email), 0) + 1
    cache.set(_otp_attempts_key(email), attempts, OTP_TTL_SECONDS)
    return {"code": code, "attempts": attempts}


def clear_code(email):
    # Elimina el codigo de cache.
    policy_store.delete_otp(email)
    cache.delete(_otp_attempts_key(email))


def rate_limit_request(email):
    # Limite de solicitudes por correo.
    key = _otp_request_key(email)
    count = cache.get(key, 0) + 1
    cache.set(key, count, OTP_REQUEST_TTL_SECONDS)
    return count > OTP_REQUEST_LIMIT


def consume_code_atomic(email, code):
    return policy_store.consume_otp(email, code)


def _otp_key(email):
    return f"otp:{email.lower()}"


def _otp_request_key(email):
    return f"otp:req:{email.lower()}"


def _otp_attempts_key(email):
    return f"otp:attempts:{email.lower()}"
