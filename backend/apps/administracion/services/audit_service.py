from ..models import AuditoriaEvento

class AuditService:

    @staticmethod
    def log_event(
        *,
        request,
        accion,
        recurso_tipo,
        recurso_id=None,
        resultado="SUCCESS",
        codigo_error=None,
        datos_antes=None,
        datos_despues=None,
        target_usuario=None,
    ):

        actor = request.user if request.user.is_authenticated else None

        AuditoriaEvento.objects.create(
            request_id=request.request_id,
            accion=accion,
            recurso_tipo=recurso_tipo,
            recurso_id=recurso_id,
            actor_usuario=actor,
            actor_nombre=str(actor) if actor else "Sistema",
            target_usuario=target_usuario,
            resultado=resultado,
            codigo_error=codigo_error,
            ip_origen=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT"),
            datos_antes=datos_antes,
            datos_despues=datos_despues,
            meta={
                "endpoint": request.path,
                "method": request.method,
                "module": "rbac",
            },
        )
