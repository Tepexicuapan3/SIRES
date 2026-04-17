from typing import Optional

from django.core.exceptions import ImproperlyConfigured
from rest_framework.exceptions import APIException
from rest_framework.permissions import BasePermission

from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.csrf_service import validate_csrf
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.session_service import authenticate_request

MUTATING_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})


class CatalogApiException(APIException):
    def __init__(self, *, code: str, message: str, http_status: int, request_id: Optional[str] = None, details: Optional[dict] = None):
        self.status_code = http_status
        self.detail = {
            "code": code,
            "message": message,
            "status": http_status,
            "details": details or {},
            "requestId": request_id,
        }


class HasCatalogPermission(BasePermission):
    def __init__(self, action: str, catalog: str):
        self.action = action
        self.catalog = catalog

    def has_permission(self, request, _view) -> bool:
        request_id = request.headers.get("X-Request-ID")

        # 1. CSRF primero — evita hits innecesarios a la base de datos
        if request.method in MUTATING_METHODS and not validate_csrf(request):
            raise CatalogApiException(
                code="CSRF_INVALID",
                message="Token CSRF inválido o ausente",
                http_status=403,
                request_id=request_id,
            )

        # 2. Autenticación
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

        # 3. Verificación de permisos
        required_permission = f"{self.catalog}:{self.action}"
        user_permissions = UserRepository.build_auth_user(user).get("permissions", [])

        if "*" not in user_permissions and required_permission not in user_permissions:
            raise CatalogApiException(
                code="INSUFFICIENT_PERMISSIONS",
                message="No tienes permiso para esta acción",
                http_status=403,
                request_id=request_id,
            )

        return True


class CatalogPermissionMixin:
    catalog: Optional[str] = None

    _ACTION_MAP = {
        "GET": "read",
        "HEAD": "read",
        "OPTIONS": "read",
        "POST": "create",
        "PUT": "update",
        "PATCH": "update",
        "DELETE": "delete",
    }

    def get_permissions(self) -> list:
        if not self.catalog:
            raise ImproperlyConfigured(
                f"{self.__class__.__name__} debe definir el atributo `catalog`."
            )

        request = getattr(self, "request", None)
        action = self._ACTION_MAP.get(request.method) if request else None

        if not action:
            return []

        return [
            HasCatalogPermission(
                action=action,
                catalog=f"admin:catalogos:{self.catalog}",
            )
        ]