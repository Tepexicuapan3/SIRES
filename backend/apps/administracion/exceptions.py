'''from rest_framework.exceptions import APIException


class RBACException(APIException):
    status_code = 400
    default_code = "RBAC_ERROR"


class RoleExists(RBACException):
    status_code = 409
    default_detail = "El rol ya existe."
    default_code = "ROLE_EXISTS"


class RoleSystemProtected(RBACException):
    status_code = 403
    default_detail = "El rol de sistema no puede modificarse."
    default_code = "ROLE_SYSTEM_PROTECTED"


class RoleHasUsers(RBACException):
    default_detail = "El rol tiene usuarios activos asignados."
    default_code = "ROLE_HAS_USERS"


class CannotRemoveLastRole(RBACException):
    default_detail = "No se puede quitar el último rol activo del usuario."
    default_code = "CANNOT_REMOVE_LAST_ROLE"


class PermissionDependency(RBACException):
    default_detail = "Violación de dependencia de permisos."
    default_code = "PERMISSION_DEPENDENCY"'''


from rest_framework.views import exception_handler
from rest_framework.response import Response
from datetime import datetime


def _utc_now_iso():
    return f"{datetime.utcnow().isoformat()}Z"


def custom_exception_handler(exc, context):

    response = exception_handler(exc, context)

    if response is None:
        return Response(
            {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc),
                "status": 500,
                "timestamp": _utc_now_iso(),
            },
            status=500,
        )

    source = response.data if isinstance(response.data, dict) else {}
    if "detail" in source and isinstance(source["detail"], dict):
        source = source["detail"]

    if isinstance(source, dict) and "code" in source and "message" in source:
        payload = {
            "code": source["code"],
            "message": source["message"],
            "status": response.status_code,
            "timestamp": _utc_now_iso(),
        }
        if source.get("details"):
            payload["details"] = source["details"]
        if source.get("requestId"):
            payload["requestId"] = source["requestId"]
        return Response(payload, status=response.status_code)

    return Response(
        {
            "code": "API_ERROR",
            "message": str(exc),
            "status": response.status_code,
            "timestamp": _utc_now_iso(),
        },
        status=response.status_code,
    )
