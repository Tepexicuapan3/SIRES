from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.administracion.policies.rbac_role_mutation_policy import (
    RbacRoleMutationPolicy,
)
from apps.administracion.services.audit_service import AuditService
from apps.administracion.use_cases.rbac_write import (
    AssignRolePermissionsUseCase,
    RevokeRolePermissionUseCase,
    RbacWriteError,
)
from apps.administracion.views.rbac_views import (
    _active_user_ids_for_role,
    _role_permissions,
)
from apps.authentication.services.response_service import error_response, get_request_id


class _RbacRolePermissionBaseView(APIView):
    authentication_classes = []
    permission_classes = []

    policy_class = RbacRoleMutationPolicy

    def _request_id(self, request):
        return getattr(request, "request_id", None) or get_request_id(request)

    def _audit(
        self,
        request,
        action,
        *,
        resource_id=None,
        result="SUCCESS",
        error_code=None,
        before=None,
        after=None,
        target_user=None,
    ):
        AuditService.log_event(
            request=request,
            accion=action,
            recurso_tipo="role",
            recurso_id=resource_id,
            resultado=result,
            codigo_error=error_code,
            datos_antes=before,
            datos_despues=after,
            target_usuario=target_user,
            metadata={"source": "s3", "domain": "auth_access"},
        )


class RbacRolePermissionAssignView(_RbacRolePermissionBaseView):
    @transaction.atomic
    def post(self, request):
        user, auth_error = self.policy_class.authorize(
            request,
            "admin:gestion:roles:update",
            require_csrf=True,
        )
        if auth_error:
            self._audit(
                request,
                "RBAC_ROLE_PERMISSIONS_ASSIGN",
                result="FAIL",
                error_code=auth_error.data.get("code"),
            )
            return auth_error

        role_id = request.data.get("roleId")
        if role_id is None:
            role_id = request.data.get("role_id")

        permission_ids = request.data.get("permissionIds")
        if permission_ids is None:
            permission_ids = request.data.get("permission_ids", [])

        try:
            result = AssignRolePermissionsUseCase.execute(
                actor=user,
                role_id=role_id,
                permission_ids=permission_ids,
                serialize_role_permissions=_role_permissions,
                active_user_ids_for_role=_active_user_ids_for_role,
            )
        except RbacWriteError as exc:
            self._audit(
                request,
                "RBAC_ROLE_PERMISSIONS_ASSIGN",
                resource_id=exc.resource_id,
                result="FAIL",
                error_code=exc.code,
                target_user=exc.target_user,
            )
            return error_response(
                exc.code,
                exc.message,
                exc.status_code,
                details=exc.details,
                request_id=self._request_id(request),
            )

        role = result["role"]
        payload = result["payload"]
        self._audit(
            request,
            "RBAC_ROLE_PERMISSIONS_ASSIGN",
            resource_id=role.id_rol,
            before=result["before"],
            after=payload,
        )
        return Response(payload, status=status.HTTP_200_OK)


class RbacRolePermissionRevokeView(_RbacRolePermissionBaseView):
    @transaction.atomic
    def delete(self, request, role_id, permission_id):
        user, auth_error = self.policy_class.authorize(
            request,
            "admin:gestion:roles:update",
            require_csrf=True,
        )
        if auth_error:
            self._audit(
                request,
                "RBAC_ROLE_PERMISSION_REVOKE",
                resource_id=role_id,
                result="FAIL",
                error_code=auth_error.data.get("code"),
            )
            return auth_error

        try:
            result = RevokeRolePermissionUseCase.execute(
                actor=user,
                role_id=role_id,
                permission_id=permission_id,
                serialize_role_permissions=_role_permissions,
                active_user_ids_for_role=_active_user_ids_for_role,
            )
        except RbacWriteError as exc:
            self._audit(
                request,
                "RBAC_ROLE_PERMISSION_REVOKE",
                resource_id=exc.resource_id,
                result="FAIL",
                error_code=exc.code,
                target_user=exc.target_user,
            )
            return error_response(
                exc.code,
                exc.message,
                exc.status_code,
                details=exc.details,
                request_id=self._request_id(request),
            )

        role = result["role"]
        payload = result["payload"]
        self._audit(
            request,
            "RBAC_ROLE_PERMISSION_REVOKE",
            resource_id=role.id_rol,
            before=result["before"],
            after=payload,
        )
        return Response(payload, status=status.HTTP_200_OK)
