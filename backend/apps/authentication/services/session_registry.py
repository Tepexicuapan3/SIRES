from django.utils import timezone

from apps.authentication.infrastructure.policy_store import PolicyStore
from apps.authentication.models import SesionUsuario
from apps.authentication.services.errors import (
    AuthServiceError,
    PolicyStoreUnavailableError,
)
from apps.authentication.services.token_service import (
    ACTIVE_SESSION_TTL_SECONDS,
    create_access_refresh_tokens,
)

policy_store = PolicyStore()


def start_session(user, ip_address, user_agent, session_id=None, block_if_active=False):
    # Emite tokens y registra la sesion activa (Redis) + el historial (Postgres).
    # session_id: si se pasa, se reusa (continua la misma sesion en vez de
    # abrir una nueva fila de historial), usado por onboarding.
    try:
        if block_if_active and policy_store.get_active_session(user.id_usuario):
            raise AuthServiceError(
                "SESSION_ALREADY_ACTIVE",
                "Tieness una sesión activa en otro equipo. Cerrar la sesión para continuar.",
                409,
            )

        access_token, refresh_token, sid = create_access_refresh_tokens(
            user, session_id=session_id
        )
        policy_store.set_active_session(user.id_usuario, sid, ACTIVE_SESSION_TTL_SECONDS)
    except PolicyStoreUnavailableError as exc:
        raise AuthServiceError(
            "SERVICE_UNAVAILABLE",
            "Servicio temporalmente no disponible",
            503,
        ) from exc

    if session_id is None:
        SesionUsuario.objects.create(
            usuario=user,
            session_id=sid,
            ip_origen=ip_address,
            user_agent=user_agent,
        )

    return access_token, refresh_token, sid


def close_session(user, session_id):
    # Libera la sesion activa (Redis) y cierra el historial (logout explicito).
    policy_store.clear_active_session(user.id_usuario)
    (
        SesionUsuario.objects.filter(
            usuario=user, session_id=session_id, fch_fin__isnull=True
        ).update(fch_fin=timezone.now(), cerrada_por=SesionUsuario.CierrePor.LOGOUT)
    )
