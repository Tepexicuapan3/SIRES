from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings

from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.token_service import (
    create_access_refresh_tokens,
    decode_reset_token,
)


def reset_password(raw_reset_token, new_password, ip_address):
    # Valida token reset y cambia password.
    try:
        payload = decode_reset_token(raw_reset_token)
    except TokenError as exc:
        error_code = "TOKEN_EXPIRED" if "expired" in str(exc).lower() else "TOKEN_INVALID"
        message = "Tu sesión ha expirado" if error_code == "TOKEN_EXPIRED" else "Token inválido"
        raise AuthServiceError(error_code, message, 401) from exc

    user_id = str(payload.get(api_settings.USER_ID_CLAIM))
    user = UserRepository.get_by_id(user_id)
    if not user:
        raise AuthServiceError("USER_NOT_FOUND", "Usuario no encontrado", 404)

    try:
        validate_password(new_password)
    except ValidationError as exc:
        raise AuthServiceError(
            "PASSWORD_TOO_WEAK",
            "La contraseña es demasiado débil",
            400,
            details={"newPassword": exc.messages},
        ) from exc

    UserRepository.update_password(user, new_password)
    UserRepository.mark_password_reset(user)

    UserRepository.mark_last_access(user, ip_address)
    access_token, refresh_token = create_access_refresh_tokens(user)

    return {
        "user": UserRepository.build_auth_user(user),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }
