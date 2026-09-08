from django.utils import timezone

from apps.administracion.models import AuditoriaEvento
from apps.authentication.services.observability_service import record_audit_event
from apps.authentication.services.response_service import get_client_ip, get_request_id


def log_event(
    request,
    action,
    result,
    actor_user=None,
    target_user=None,
    error_code=None,
    meta=None,
    *,
    resource_type="auth",
    resource_id=None,
    datos_antes=None,
    datos_despues=None,
    raise_on_error=False,
):
    """
    Registra evento de auditoria.

    Extension D1 (change `somatometria-modulo-integral`): los kwargs
    `resource_type`/`resource_id`/`datos_antes`/`datos_despues`/
    `raise_on_error` son TODOS opcionales con default que preserva el
    comportamiento historico -- los 73 callers existentes (que no pasan
    ninguno de estos kwargs) siguen viendo `recurso_tipo="auth"` y un
    `except Exception: return` silencioso, byte por byte igual que antes.

    `raise_on_error=True` es para auditoria ESTRICTA (ej. edicion
    auditada de somatometria): si la escritura de `AuditoriaEvento` falla,
    la excepcion se re-lanza para que el `transaction.atomic()` del
    caller revierta TODA la operacion, no solo el registro de auditoria.
    """
    request_id = get_request_id(request)
    ip_origen = get_client_ip(request)
    user_agent = request.META.get("HTTP_USER_AGENT")

    payload_meta = {"module": "auth"}
    if meta:
        payload_meta.update(meta)

    try:
        AuditoriaEvento.objects.create(
            fch_evento=timezone.now(),
            request_id=request_id or "",
            accion=action,
            recurso_tipo=resource_type,
            recurso_id=resource_id,
            resultado=result,
            codigo_error=error_code,
            ip_origen=ip_origen,
            user_agent=user_agent,
            actor_usuario=actor_user,
            target_usuario=target_user,
            datos_antes=datos_antes,
            datos_despues=datos_despues,
            meta=payload_meta,
        )
        record_audit_event(resource_type, action, result)
    except Exception:
        # No bloquear el flujo si falla auditoria -- salvo que el caller
        # pida lo contrario explicitamente (`raise_on_error=True`).
        if raise_on_error:
            raise
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
