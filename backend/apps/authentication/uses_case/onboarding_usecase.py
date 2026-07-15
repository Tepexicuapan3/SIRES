from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.session_registry import start_session


def complete_onboarding(user, new_password, terms_accepted, ip_address, session_id=None):
    # Completa onboarding y emite tokens nuevos.
    if not terms_accepted:
        raise AuthServiceError(
            "TERMS_NOT_ACCEPTED",
            "Debes aceptar los términos y condiciones",
            400,
        )

    try:
        validate_password(new_password)
    except ValidationError as exc:
        raise AuthServiceError(
            "PASSWORD_TOO_WEAK",
            "La contraseña es demasiado débil",
            400,
            details={"newPassword": exc.messages},
        ) from exc

    if not user.cambiar_clave and user.terminos_acept:
        UserRepository.mark_last_access(user, ip_address)
        access_token, refresh_token, _sid = start_session(
            user, ip_address, None, session_id=session_id
        )
        return {
            "user": UserRepository.build_auth_user(user),
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    UserRepository.update_password(user, new_password)
    UserRepository.mark_onboarding_completed(user)

    UserRepository.mark_last_access(user, ip_address)
    access_token, refresh_token, _sid = start_session(
        user, ip_address, None, session_id=session_id
    )

    return {
        "user": UserRepository.build_auth_user(user),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }
