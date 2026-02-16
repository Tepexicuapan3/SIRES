from rest_framework.permissions import BasePermission
from rest_framework.exceptions import APIException
from typing import Optional


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
    action: Optional[str] = None  # "read" | "create" | "update" | "delete"
    catalog: Optional[str] = None  # "permission", "care_center", etc.
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            raise CatalogApiException(
                code="TOKEN_INVALID",
                message="No autenticado o token inválido",
                http_status=401,
                request_id=request.headers.get("X-Request-ID"),
            )
        if not self.action or not self.catalog:
            raise CatalogApiException(
                code="PERMISSION_DENIED",
                message="Permiso de catálogo mal configurado",
                http_status=403,
                request_id=request.headers.get("X-Request-ID"),
            )
        # Ajustá al sistema real:
        if not request.user.has_perm(f"{self.catalog}:{self.action}"):
            raise CatalogApiException(
                code="PERMISSION_DENIED",
                message="Sin permiso para este recurso",
                http_status=403,
                request_id=request.headers.get("X-Request-ID"),
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
        perm = HasCatalogPermission()
        perm.action = action
        perm.catalog = f"admin:catalogos:{self.catalog}"
        return [perm]
