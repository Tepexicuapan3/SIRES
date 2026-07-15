from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings

from apps.authentication.infrastructure.policy_store import PolicyStore
from apps.authentication.repositories.user_repository import UserRepository

from .errors import AuthServiceError, PolicyStoreUnavailableError
from .token_service import ACCESS_COOKIE, ACTIVE_SESSION_TTL_SECONDS, decode_access_token

policy_store = PolicyStore()


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

    user_id_claim = payload.get(api_settings.USER_ID_CLAIM)
    if user_id_claim in (None, ""):
        # Si el claim esta ausente, el token es invalido.
        raise AuthServiceError("TOKEN_INVALID", "Token inválido", 401)
    user_id = str(user_id_claim)

    user = UserRepository.get_by_id(user_id)
    if not user:
        raise AuthServiceError("SESSION_EXPIRED", "Tu sesión ha expirado", 401)

    if not user.est_activo:
        # Usuario inactivo o inexistente.
        raise AuthServiceError("PERMISSION_DENIED", "No tienes permiso para esta acción", 403)

    if user.est_bloqueado or user.fch_baja:
        raise AuthServiceError("SESSION_EXPIRED", "Tu sesión ha expirado", 401)

    sid = payload.get("sid")
    try:
        active_sid = policy_store.get_active_session(user.id_usuario)
        if not sid or sid != active_sid:
            # La sesion fue cerrada (logout), expiro por inactividad (TTL) o
            # fue reemplazada por un login mas reciente en otro equipo.
            raise AuthServiceError("SESSION_EXPIRED", "Tu sesión ha expirado", 401)
        # Sliding expiration: cada request autenticado mantiene viva la sesion.
        policy_store.touch_active_session(user.id_usuario, ACTIVE_SESSION_TTL_SECONDS)
    except PolicyStoreUnavailableError:
        # Redis caido: no podemos verificar sesion unica. Fail-open a
        # proposito -- degradar el control de sesion es preferible a tirar
        # abajo el acceso de todo el sistema por un blip de infraestructura.
        pass

    request.user = user
    request.session_id = sid
    return user
