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

def custom_exception_handler(exc, context):

    response = exception_handler(exc, context)

    if response is None:
        return Response(
            {
                "code": "INTERNAL_ERROR",
                "message": str(exc),
                "status": 500,
                "timestamp": datetime.utcnow().isoformat(),
            },
            status=500,
        )

    return Response(
        {
            "code": "API_ERROR",
            "message": str(exc),
            "status": response.status_code,
            "timestamp": datetime.utcnow().isoformat(),
        },
        status=response.status_code,
    )

