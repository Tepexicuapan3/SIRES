from datetime import timezone as dt_timezone

from django.utils import timezone
from rest_framework.response import Response


def get_request_id(request):
    # Obtiene el id de trazabilidad del request priorizando middleware.
    request_id = getattr(request, "request_id", None)
    if request_id:
        return request_id

    return request.headers.get("X-Request-ID")


def get_client_ip(request):
    # REMOTE_ADDR es el socket que le habla directo a Daphne -- detras del
    # proxy interno de nginx (ver nginx/proxy.conf) eso es SIEMPRE el propio
    # contenedor del proxy, nunca el cliente real. X-Real-IP es el que el
    # gateway externo establece con el remote_addr real y el proxy interno
    # ahora respeta sin pisarlo (ver nginx/proxy.conf).
    return request.META.get("HTTP_X_REAL_IP") or request.META.get("REMOTE_ADDR")


def error_response(error_code, message, status_code, details=None, request_id=None):
    # Estructura estandar de error segun standards.
    payload = {
        "code": error_code,
        "message": message,
        "status": status_code,
        "timestamp": timezone.now()
        .astimezone(dt_timezone.utc)
        .isoformat()
        .replace("+00:00", "Z"),
    }

    if details:
        payload["details"] = details
    if request_id:
        payload["requestId"] = request_id

    response = Response(payload, status=status_code)
    if request_id:
        response["X-Request-ID"] = request_id
    return response
