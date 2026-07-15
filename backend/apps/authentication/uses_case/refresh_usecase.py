from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings

from apps.authentication.infrastructure.policy_store import PolicyStore
from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.token_service import (
    ACTIVE_SESSION_TTL_SECONDS,
    create_access_refresh_tokens,
    validate_refresh_token,
)

policy_store = PolicyStore()


def refresh_tokens(raw_refresh_token):
    # Valida refresh y rota tokens.
    try:
        refresh = validate_refresh_token(raw_refresh_token)
    except TokenError as exc:
        error_code = (
            "REFRESH_TOKEN_EXPIRED" if "expired" in str(exc).lower() else "TOKEN_INVALID"
        )
        message = "Tu sesión ha expirado" if error_code == "REFRESH_TOKEN_EXPIRED" else "Token inválido"
        raise AuthServiceError(error_code, message, 401) from exc

    user_id = str(refresh.get(api_settings.USER_ID_CLAIM))
    user = UserRepository.get_by_id(user_id)
    if not user or not user.est_activo or user.est_bloqueado or user.fch_baja:
        raise AuthServiceError("SESSION_EXPIRED", "Tu sesión ha expirado", 401)

    sid = refresh.get("sid")
    if not sid or policy_store.get_active_session(user.id_usuario) != sid:
        # El refresh token es de una sesion que ya no es la activa
        # (logout, expiro por TTL, o la reemplazo un login en otro equipo).
        raise AuthServiceError("SESSION_EXPIRED", "Tu sesión ha expirado", 401)

    # Rota los tokens preservando el mismo sid: es la MISMA sesion,
    # no una nueva -- si generamos un sid nuevo aca, la desincronizamos
    # de lo que ya esta registrado como sesion activa en Redis.
    access_token, refresh_token, _sid = create_access_refresh_tokens(
        user, session_id=sid
    )
    policy_store.touch_active_session(user.id_usuario, ACTIVE_SESSION_TTL_SECONDS)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
    }
