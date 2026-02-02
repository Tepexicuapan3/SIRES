from datetime import timezone as dt_timezone

from django.utils import timezone
from rest_framework.response import Response


def get_request_id(request):
    # Obtiene el id de trazabilidad del request.
    return request.headers.get("X-Request-ID")


def error_response(error_code, message, status_code, details=None, request_id=None):
    # Estructura estandar de error segun standards.
    payload = {
        "code": error_code,
        "message": message,
        "status": status_code,
        "timestamp": timezone.now().astimezone(dt_timezone.utc).isoformat().replace("+00:00", "Z"),
    }

    if details:
        payload["details"] = details
    if request_id:
        payload["requestId"] = request_id

    return Response(payload, status=status_code)
