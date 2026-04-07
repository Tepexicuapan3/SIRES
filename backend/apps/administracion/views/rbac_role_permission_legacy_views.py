from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.administracion.use_cases.rbac_write import (
    AssignRolePermissionsUseCase,
    RevokeRolePermissionUseCase,
    RbacWriteError,
)
from apps.authentication.services.response_service import error_response


class RbacRolePermissionLegacyAssignView(APIView):
    authentication_classes = []
    permission_classes = []

    @transaction.atomic
    def post(self, request):
        from apps.administracion.views.rbac_views import (
            _active_user_ids_for_role,
            _audit,
            _authorize,
            _request_id,
            _role_permissions,
        )

        user, auth_error = _authorize(
            request,
            "admin:gestion:roles:update",
            require_csrf=True,
        )
        if auth_error:
            _audit(
                request,
                "RBAC_ROLE_PERMISSIONS_ASSIGN",
                "role",
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
            _audit(
                request,
                "RBAC_ROLE_PERMISSIONS_ASSIGN",
                "role",
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
                request_id=_request_id(request),
            )

        role = result["role"]
        payload = result["payload"]
        _audit(
            request,
            "RBAC_ROLE_PERMISSIONS_ASSIGN",
            "role",
            resource_id=role.id_rol,
            result="SUCCESS",
            before=result["before"],
            after=payload,
        )
        return Response(payload, status=status.HTTP_200_OK)


class RbacRolePermissionLegacyRevokeView(APIView):
    authentication_classes = []
    permission_classes = []

    @transaction.atomic
    def delete(self, request, role_id, permission_id):
        from apps.administracion.views.rbac_views import (
            _active_user_ids_for_role,
            _audit,
            _authorize,
            _request_id,
            _role_permissions,
        )

        user, auth_error = _authorize(
            request,
            "admin:gestion:roles:update",
            require_csrf=True,
        )
        if auth_error:
            _audit(
                request,
                "RBAC_ROLE_PERMISSION_REVOKE",
                "role",
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
            _audit(
                request,
                "RBAC_ROLE_PERMISSION_REVOKE",
                "role",
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
                request_id=_request_id(request),
            )

        role = result["role"]
        payload = result["payload"]
        _audit(
            request,
            "RBAC_ROLE_PERMISSION_REVOKE",
            "role",
            resource_id=role.id_rol,
            result="SUCCESS",
            before=result["before"],
            after=payload,
        )
        return Response(payload, status=status.HTTP_200_OK)
