from apps.authentication.application.auth_policy_service import AuthPolicyService
from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.token_service import create_access_refresh_tokens

policy_service = AuthPolicyService()


def login_user(username, password, ip_address):
    # Autentica usuario y genera tokens.
    policy_service.check_login(username, ip_address)
    user = UserRepository.get_by_username(username)

    if not user:
        raise AuthServiceError(
            "INVALID_CREDENTIALS",
            "Usuario o contraseña incorrectos",
            401,
        )

    if not UserRepository.verify_password(user, password):
        # Suma intentos fallidos y retorna error.
        policy_service.record_login_failure(username, ip_address)
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
    policy_service.record_login_success(username, ip_address)
    UserRepository.mark_last_access(user, ip_address)

    access_token, refresh_token = create_access_refresh_tokens(user)
    requires_onboarding = user.cambiar_clave or not user.terminos_acept

    return {
        "user": UserRepository.build_auth_user(user),
        "access_token": access_token,
        "refresh_token": refresh_token,
        "requires_onboarding": requires_onboarding,
    }
