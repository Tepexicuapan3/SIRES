from typing import Optional

from rest_framework.exceptions import APIException
from rest_framework.permissions import BasePermission

from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.csrf_service import validate_csrf
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.session_service import authenticate_request


class CatalogApiException(APIException):
    status_code = 400

    def __init__(self, *, code, message, http_status, request_id=None, details=None):
        self.status_code = http_status
        self.detail = {
            "code": code,
            "message": message,
            "status": http_status,
            "details": details or {},
            "requestId": request_id,
        }


class HasCatalogPermission(BasePermission):
    action: Optional[str] = None
    catalog: Optional[str] = None

    def has_permission(self, request, view):
        request_id = request.headers.get("X-Request-ID")

        try:
            user = authenticate_request(request)
        except AuthServiceError as exc:
            raise CatalogApiException(
                code=exc.code,
                message=exc.message,
                http_status=exc.status_code,
                request_id=request_id,
                details=exc.details,
            )

        request.user = user

        if not self.action or not self.catalog:
            raise CatalogApiException(
                code="PERMISSION_DENIED",
                message="No tienes permiso para esta acción",
                http_status=403,
                request_id=request_id,
            )

        required_permission = f"{self.catalog}:{self.action}"
        user_permissions = UserRepository.build_auth_user(user).get("permissions", [])

        if "*" not in user_permissions and required_permission not in user_permissions:
            raise CatalogApiException(
                code="PERMISSION_DENIED",
                message="No tienes permiso para esta acción",
                http_status=403,
                request_id=request_id,
            )

        if request.method in {"POST", "PUT", "PATCH", "DELETE"} and not validate_csrf(request):
            raise CatalogApiException(
                code="PERMISSION_DENIED",
                message="No tienes permiso para esta acción",
                http_status=403,
                request_id=request_id,
            )

        return True


class CatalogPermissionMixin:
    catalog = None

    def get_permissions(self):
        action_map = {
            "GET": "read",
            "HEAD": "read",
            "OPTIONS": "read",
            "POST": "create",
            "PUT": "update",
            "PATCH": "update",
            "DELETE": "delete",
        }

        request = getattr(self, "request", None)
        action = action_map.get(request.method) if request else None

        if not action or not self.catalog:
            return []

        permission = HasCatalogPermission()
        permission.action = action
        permission.catalog = f"admin:catalogos:{self.catalog}"
        return [permission]
