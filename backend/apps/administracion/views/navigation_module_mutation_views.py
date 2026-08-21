from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.administracion.policies.navigation_module_mutation_policy import (
    NavigationModuleMutationPolicy,
)
from apps.administracion.repositories.navigation_menu_repository import (
    NavigationMenuRepository,
)
from apps.administracion.repositories.navigation_module_mutation_repository import (
    NavigationModuleMutationRepository,
)
from apps.administracion.services.audit_service import AuditService
from apps.administracion.services.navigation_menu_serializers import serialize_module_summary
from apps.administracion.use_cases.navigation.create_module import CreateModuleUseCase
from apps.administracion.use_cases.navigation.exceptions import NavigationModuleError
from apps.administracion.use_cases.navigation.hide_module import HideModuleUseCase
from apps.administracion.use_cases.navigation.move_module import MoveModuleUseCase
from apps.administracion.use_cases.navigation.reorder_module import ReorderModuleUseCase
from apps.administracion.use_cases.navigation.restore_module import RestoreModuleUseCase
from apps.administracion.use_cases.navigation.update_module import UpdateModuleUseCase
from apps.authentication.services.response_service import error_response, get_request_id


def _module_permission_codes(modulo):
    return sorted(
        relacion.id_permiso.codigo for relacion in modulo.permisos.select_related("id_permiso")
    )


class _NavigationModuleMutationBaseView(APIView):
    authentication_classes = []
    permission_classes = []

    read_repository_class = NavigationMenuRepository
    mutation_repository_class = NavigationModuleMutationRepository
    policy_class = NavigationModuleMutationPolicy

    def _request_id(self, request):
        return getattr(request, "request_id", None) or get_request_id(request)

    def _audit(
        self,
        request,
        action,
        *,
        resource_id=None,
        clave=None,
        result="SUCCESS",
        error_code=None,
        before=None,
        after=None,
    ):
        """
        `resource_id` es SIEMPRE numerico (`recurso_id` es `BigIntegerField`
        en `AuditoriaEvento`) -- nunca pasar aca la `clave` (string) de la
        URL. Cuando todavia no se resolvio el `Modulo` (falla de auth, o
        "no encontrado" antes de tener el id), se manda `clave=...` y viaja
        en `metadata` en su lugar.
        """
        metadata = {"source": "s2", "domain": "navigation"}
        if clave is not None:
            metadata["clave"] = clave
        AuditService.log_event(
            request=request,
            accion=action,
            recurso_tipo="modulo",
            recurso_id=resource_id,
            resultado=result,
            codigo_error=error_code,
            datos_antes=before,
            datos_despues=after,
            metadata=metadata,
        )

    def _error(self, request, exc):
        return error_response(
            exc.code,
            exc.message,
            exc.status_code,
            details=exc.details,
            request_id=self._request_id(request),
        )


class CreateModuleView(_NavigationModuleMutationBaseView):
    @transaction.atomic
    def post(self, request):
        user, auth_error = self.policy_class.authorize(
            request,
            "admin:gestion:modulos:create",
            require_csrf=True,
        )
        if auth_error:
            self._audit(request, "MODULE_CREATE", result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        read_repository = self.read_repository_class()
        mutation_repository = self.mutation_repository_class()

        try:
            modulo = CreateModuleUseCase(read_repository, mutation_repository).execute(
                data=request.data,
                actor=user,
            )
        except NavigationModuleError as exc:
            self._audit(
                request,
                "MODULE_CREATE",
                result="FAIL",
                error_code=exc.code,
            )
            return self._error(request, exc)

        after = serialize_module_summary(modulo, permissions=_module_permission_codes(modulo))
        self._audit(request, "MODULE_CREATE", resource_id=modulo.id_modulo, after=after)
        return Response(
            {"key": modulo.clave, "id": modulo.id_modulo},
            status=status.HTTP_201_CREATED,
        )


class UpdateModuleView(_NavigationModuleMutationBaseView):
    """
    PATCH unico para campos simples Y para mover de padre: si el payload
    trae `parentKey`, ademas de `UpdateModuleUseCase` se invoca
    `MoveModuleUseCase` (2 use cases, 1 sola transaccion atomica -- misma
    idea que `RbacRoleMutationUpdateView`, que hace una unica llamada
    porque ahi todos los campos viven en un solo use case).
    """

    @transaction.atomic
    def patch(self, request, clave):
        user, auth_error = self.policy_class.authorize(
            request,
            "admin:gestion:modulos:update",
            require_csrf=True,
        )
        if auth_error:
            self._audit(
                request, "MODULE_UPDATE", clave=clave, result="FAIL",
                error_code=auth_error.data.get("code"),
            )
            return auth_error

        read_repository = self.read_repository_class()
        mutation_repository = self.mutation_repository_class()

        existing = read_repository.get_by_clave(clave)
        existing_id = existing.id_modulo if existing else None
        before = (
            serialize_module_summary(existing, permissions=_module_permission_codes(existing))
            if existing
            else None
        )

        try:
            modulo = UpdateModuleUseCase(read_repository, mutation_repository).execute(
                clave=clave,
                data=request.data,
                actor=user,
            )
            if "parentKey" in request.data:
                modulo = MoveModuleUseCase(read_repository, mutation_repository).execute(
                    clave=clave,
                    new_parent_key=request.data.get("parentKey"),
                )
        except NavigationModuleError as exc:
            self._audit(
                request, "MODULE_UPDATE", resource_id=existing_id, clave=clave,
                result="FAIL", error_code=exc.code,
            )
            return self._error(request, exc)

        after = serialize_module_summary(modulo, permissions=_module_permission_codes(modulo))
        self._audit(
            request, "MODULE_UPDATE", resource_id=modulo.id_modulo, before=before, after=after,
        )
        return Response({"module": after}, status=status.HTTP_200_OK)


class ModuleVisibilityView(_NavigationModuleMutationBaseView):
    """
    Un solo endpoint para ocultar Y restaurar: el body decide la direccion
    (`{"isActive": false}` oculta, `{"isActive": true}` restaura). Evita
    duplicar rutas para lo que en esencia es un unico toggle de
    visibilidad.
    """

    @transaction.atomic
    def patch(self, request, clave):
        user, auth_error = self.policy_class.authorize(
            request,
            "admin:gestion:modulos:delete",
            require_csrf=True,
        )
        if auth_error:
            self._audit(
                request, "MODULE_HIDE", clave=clave, result="FAIL",
                error_code=auth_error.data.get("code"),
            )
            return auth_error

        read_repository = self.read_repository_class()
        mutation_repository = self.mutation_repository_class()
        make_active = bool(request.data.get("isActive", False))
        action = "MODULE_RESTORE" if make_active else "MODULE_HIDE"

        try:
            if make_active:
                modulo = RestoreModuleUseCase(read_repository, mutation_repository).execute(
                    clave=clave
                )
                affected_ids = [modulo.id_modulo]
            else:
                modulo, affected_ids = HideModuleUseCase(
                    read_repository, mutation_repository
                ).execute(clave=clave)
        except NavigationModuleError as exc:
            self._audit(request, action, clave=clave, result="FAIL", error_code=exc.code)
            return self._error(request, exc)

        after = serialize_module_summary(modulo, permissions=_module_permission_codes(modulo))
        self._audit(
            request,
            action,
            resource_id=modulo.id_modulo,
            after={**after, "affectedCount": len(affected_ids)},
        )
        return Response({"module": after}, status=status.HTTP_200_OK)


class ReorderModulesView(_NavigationModuleMutationBaseView):
    @transaction.atomic
    def patch(self, request):
        user, auth_error = self.policy_class.authorize(
            request,
            "admin:gestion:modulos:update",
            require_csrf=True,
        )
        if auth_error:
            self._audit(request, "MODULE_REORDER", result="FAIL", error_code=auth_error.data.get("code"))
            return auth_error

        read_repository = self.read_repository_class()
        mutation_repository = self.mutation_repository_class()

        try:
            result = ReorderModuleUseCase(read_repository, mutation_repository).execute(
                parent_key=request.data.get("parentKey"),
                ordered_keys=request.data.get("orderedKeys"),
            )
        except NavigationModuleError as exc:
            self._audit(request, "MODULE_REORDER", result="FAIL", error_code=exc.code)
            return self._error(request, exc)

        self._audit(
            request,
            "MODULE_REORDER",
            after={"parentKey": request.data.get("parentKey"), "order": result},
        )
        return Response({"modules": result}, status=status.HTTP_200_OK)
