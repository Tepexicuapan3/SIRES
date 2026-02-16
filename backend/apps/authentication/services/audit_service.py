from django.utils import timezone

from apps.administracion.models import AuditoriaEvento
from apps.authentication.services.response_service import get_request_id


def log_event(
    request,
    action,
    result,
    actor_user=None,
    target_user=None,
    error_code=None,
    meta=None,
):
    # Registra evento de auditoria.
    request_id = get_request_id(request)
    ip_origen = request.META.get("REMOTE_ADDR")
    user_agent = request.META.get("HTTP_USER_AGENT")

    payload_meta = {"module": "auth"}
    if meta:
        payload_meta.update(meta)

    try:
        AuditoriaEvento.objects.create(
            fch_evento=timezone.now(),
            request_id=request_id or "",
            accion=action,
            recurso_tipo="auth",
            resultado=result,
            codigo_error=error_code,
            ip_origen=ip_origen,
            user_agent=user_agent,
            actor_usuario=actor_user,
            target_usuario=target_user,
            meta=payload_meta,
        )
    except Exception:
        # No bloquear el flujo si falla auditoria.
        return


def mask_email(email):
    if not email or "@" not in email:
        return "***"
    name, domain = email.split("@", 1)
    return f"{name[:1]}***@{domain}"


def mask_username(username):
    if not username:
        return "***"
    return f"{username[:1]}***"
