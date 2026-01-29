from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings

from apps.authentication.repositories.user_repository import UserRepository

from .errors import AuthServiceError
from .token_service import ACCESS_COOKIE, decode_access_token


def authenticate_request(request):
    # Valida access token desde cookie.
    raw_token = request.COOKIES.get(ACCESS_COOKIE)
    if not raw_token:
        raise AuthServiceError(
            "TOKEN_INVALID",
            "Token inválido",
            401,
        )

    try:
        payload = decode_access_token(raw_token)
    except TokenError as exc:
        error_code = "TOKEN_EXPIRED" if "expired" in str(exc).lower() else "TOKEN_INVALID"
        message = "Tu sesión ha expirado" if error_code == "TOKEN_EXPIRED" else "Token inválido"
        raise AuthServiceError(error_code, message, 401) from exc

    user_id = str(payload.get(api_settings.USER_ID_CLAIM))
    if not user_id:
        # Si el claim esta ausente, el token es invalido.
        raise AuthServiceError("TOKEN_INVALID", "Token inválido", 401)

    user = UserRepository.get_by_id(user_id)
    if not user:
        raise AuthServiceError("SESSION_EXPIRED", "Tu sesión ha expirado", 401)

    if not user.est_activo:
        # Usuario inactivo o inexistente.
        raise AuthServiceError("PERMISSION_DENIED", "No tienes permiso para esta acción", 403)

    if user.est_bloqueado or user.fch_baja:
        raise AuthServiceError("SESSION_EXPIRED", "Tu sesión ha expirado", 401)

    return user
