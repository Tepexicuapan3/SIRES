"""
apps/comunicados/permissions.py
==================================
Mixin de permisos RBAC para las vistas del CRUD de anuncios en SISEM.
Reusa ``HasCatalogPermission`` de ``apps.catalogos.permissions`` (ya hace
CSRF + autenticación + verificación de permiso) con el catálogo
``comunicados:anuncios`` -- se importa directo de ese módulo liviano en
vez de duplicar la lógica (``CatalogApiException``/``HasCatalogPermission``
no arrastran los ~1600 líneas de ``catalogos/views.py``).
"""

from apps.catalogos.permissions import HasCatalogPermission

_ACTION_MAP = {
    "GET": "read",
    "HEAD": "read",
    "OPTIONS": "read",
    "POST": "create",
    "PUT": "update",
    "PATCH": "update",
    "DELETE": "delete",
}


class ComunicadosPermissionMixin:
    def get_permissions(self):
        request = getattr(self, "request", None)
        action = _ACTION_MAP.get(request.method) if request else None

        if not action:
            return []

        return [HasCatalogPermission(action=action, catalog="comunicados:anuncios")]
