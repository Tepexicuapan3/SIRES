from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.administracion.policies.navigation_menu_policy import NavigationMenuPolicy
from apps.administracion.policies.rbac_read_policy import RbacReadPolicy
from apps.administracion.repositories.navigation_menu_repository import (
    NavigationMenuRepository,
)
from apps.administracion.services.audit_service import AuditService
from apps.administracion.services.navigation_feature_flags import (
    resolve_navigation_menu_source,
)
from apps.administracion.services.navigation_menu_serializers import (
    serialize_module_catalog,
    serialize_navigation_menu,
)
from apps.administracion.use_cases.navigation.get_navigation_menu import (
    GetNavigationMenuUseCase,
)
from apps.administracion.use_cases.navigation.list_module_catalog import (
    ListModuleCatalogUseCase,
)


class NavigationMenuView(APIView):
    authentication_classes = []
    permission_classes = []

    repository_class = NavigationMenuRepository

    def _audit(self, request, *, source, result="SUCCESS", error_code=None):
        AuditService.log_event(
            request=request,
            accion="NAVIGATION_MENU_READ",
            recurso_tipo="navigation_menu",
            resultado=result,
            codigo_error=error_code,
            metadata={"source": source, "domain": "auth_access"},
        )

    def get(self, request):
        source = resolve_navigation_menu_source()

        user, auth_error = NavigationMenuPolicy.authorize(request)
        if auth_error:
            self._audit(
                request,
                source=source,
                result="FAIL",
                error_code=auth_error.data.get("code"),
            )
            return auth_error

        if source != "db":
            payload = {"source": source, "sections": [], "secondaryItems": []}
            self._audit(request, source=source)
            return Response(payload, status=status.HTTP_200_OK)

        use_case = GetNavigationMenuUseCase(self.repository_class())
        tree = use_case.execute(usuario=user)
        payload = serialize_navigation_menu(tree, source=source)

        self._audit(request, source=source)
        return Response(payload, status=status.HTTP_200_OK)


class ModuleCatalogView(APIView):
    """
    Catalogo COMPLETO de modulos activos, sin filtrar por acceso del actor
    y sin depender del flag NAVIGATION_MENU_SOURCE: administrar el arbol de
    permisos por rol debe funcionar aunque el sidebar sirva el fallback
    estatico.

    `?includeInactive=1` suma tambien los modulos ocultos (soft-deleted) --
    lo necesita la pantalla de gestion de menus para poder restaurarlos.
    Por eso exige un permiso MAS ESPECIFICO (`admin:gestion:modulos:read`)
    que el modo default (`admin:gestion:roles:read`, sin cambios: la
    pantalla de asignacion de permisos por rol sigue funcionando igual).
    """

    authentication_classes = []
    permission_classes = []

    repository_class = NavigationMenuRepository

    def _audit(self, request, *, include_inactive, result="SUCCESS", error_code=None):
        AuditService.log_event(
            request=request,
            accion="MODULE_CATALOG_READ",
            recurso_tipo="module_catalog",
            resultado=result,
            codigo_error=error_code,
            metadata={"domain": "auth_access", "includeInactive": include_inactive},
        )

    def get(self, request):
        include_inactive = request.query_params.get("includeInactive") in ("1", "true", "True")
        required_permission = (
            "admin:gestion:modulos:read" if include_inactive else "admin:gestion:roles:read"
        )

        _, auth_error = RbacReadPolicy.authorize(request, required_permission)
        if auth_error:
            self._audit(
                request,
                include_inactive=include_inactive,
                result="FAIL",
                error_code=auth_error.data.get("code"),
            )
            return auth_error

        use_case = ListModuleCatalogUseCase(self.repository_class())
        tree = use_case.execute(include_inactive=include_inactive)
        payload = serialize_module_catalog(tree)

        self._audit(request, include_inactive=include_inactive)
        return Response(payload, status=status.HTTP_200_OK)
