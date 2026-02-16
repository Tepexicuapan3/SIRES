from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.token_service import \
    create_access_refresh_tokens
from django.core.cache import cache
from django.utils import timezone

LOGIN_ATTEMPT_TTL = 600
LOGIN_ATTEMPT_LIMIT = 5


def login_user(username, password, ip_address):
    # Autentica usuario y genera tokens.
    user = UserRepository.get_by_username(username)

    if not user:
        raise AuthServiceError("USER_NOT_FOUND", "Usuario no encontrado", 404)

    if not UserRepository.verify_password(user, password):
        # Suma intentos fallidos y retorna error.
        _increment_attempts(user)
        raise AuthServiceError(
            "INVALID_CREDENTIALS",
            "Usuario o contraseña incorrectos",
            401,
        )

    if user.fch_baja:
        raise AuthServiceError(
            "ACCOUNT_EXPIRED",
            "Tu cuenta ha expirado. Contacta a soporte",
            401,
        )

    if not user.est_activo:
        raise AuthServiceError(
            "USER_INACTIVE",
            "Cuenta desactivada por un administrador",
            403,
        )

    if user.est_bloqueado:
        raise AuthServiceError(
            "ACCOUNT_LOCKED",
            "Cuenta bloqueada por intentos fallidos",
            423,
        )

    UserRepository.reset_failed_attempts(user)
    _clear_attempts(user)
    UserRepository.mark_last_access(user, ip_address)

    access_token, refresh_token = create_access_refresh_tokens(user)
    requires_onboarding = user.cambiar_clave or not user.terminos_acept

    return {
        "user": UserRepository.build_auth_user(user),
        "access_token": access_token,
        "refresh_token": refresh_token,
        "requires_onboarding": requires_onboarding,
    }


def _increment_attempts(user):
    # Aumenta intentos y aplica rate limit.
    if not user:
        return
    key = f"login:attempts:{user.usuario}"
    attempts = cache.get(key, 0) + 1
    cache.set(key, attempts, LOGIN_ATTEMPT_TTL)

    if attempts >= LOGIN_ATTEMPT_LIMIT:
        user.est_bloqueado = True
        user.fch_modf = timezone.now()
        user.usr_modf = user
        user.save(update_fields=["est_bloqueado", "fch_modf", "usr_modf"])
        raise AuthServiceError(
            "RATE_LIMIT_EXCEEDED",
            "Demasiadas solicitudes, espera un momento",
            429,
        )


def _clear_attempts(user):
    key = f"login:attempts:{user.usuario}"
    cache.delete(key)
