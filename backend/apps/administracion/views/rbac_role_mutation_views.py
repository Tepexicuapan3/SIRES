from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.administracion.policies.rbac_role_mutation_policy import (
    RbacRoleMutationPolicy,
)
from apps.administracion.repositories.rbac_role_mutation_repository import (
    RbacRoleMutationRepository,
)
from apps.administracion.services.audit_service import AuditService
from apps.administracion.use_cases.rbac_role_mutation.create_role import (
    CreateRoleMutationUseCase,
)
from apps.administracion.use_cases.rbac_role_mutation.delete_role import (
    DeleteRoleMutationUseCase,
)
from apps.administracion.use_cases.rbac_role_mutation.exceptions import (
    RbacRoleMutationError,
)
from apps.administracion.use_cases.rbac_role_mutation.update_role import (
    UpdateRoleMutationUseCase,
)
from apps.administracion.views.rbac_views import _serialize_role
from apps.authentication.services.auth_revision import touch_users_auth_revision
from apps.authentication.services.response_service import error_response, get_request_id


class _RbacRoleMutationBaseView(APIView):
    authentication_classes = []
    permission_classes = []

    repository_class = RbacRoleMutationRepository
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
            metadata={"source": "s2", "domain": "auth_access"},
        )


class RbacRoleMutationCreateView(_RbacRoleMutationBaseView):
    @transaction.atomic
    def post(self, request):
        user, auth_error = self.policy_class.authorize(
            request,
            "admin:gestion:roles:create",
            require_csrf=True,
        )
        if auth_error:
            self._audit(
                request,
                "RBAC_ROLE_CREATE",
                result="FAIL",
                error_code=auth_error.data.get("code"),
            )
            return auth_error

        try:
            role = CreateRoleMutationUseCase(self.repository_class()).execute(
                data=request.data,
                actor_id=user.id_usuario,
            )
        except RbacRoleMutationError as exc:
            self._audit(
                request,
                "RBAC_ROLE_CREATE",
                result="FAIL",
                error_code=exc.code,
            )
            return error_response(
                exc.code,
                exc.message,
                exc.status_code,
                details=exc.details,
                request_id=self._request_id(request),
            )

        self._audit(
            request,
            "RBAC_ROLE_CREATE",
            resource_id=role.id_rol,
            after={"name": role.rol, "description": role.desc_rol},
        )
        return Response({"id": role.id_rol, "name": role.rol}, status=status.HTTP_201_CREATED)


class RbacRoleMutationUpdateView(_RbacRoleMutationBaseView):
    @transaction.atomic
    def put(self, request, role_id):
        user, auth_error = self.policy_class.authorize(
            request,
            "admin:gestion:roles:update",
            require_csrf=True,
        )
        if auth_error:
            self._audit(
                request,
                "RBAC_ROLE_UPDATE",
                resource_id=role_id,
                result="FAIL",
                error_code=auth_error.data.get("code"),
            )
            return auth_error

        repository = self.repository_class()
        role = repository.get_role(role_id)
        before = _serialize_role(role) if role else None

        try:
            role = UpdateRoleMutationUseCase(repository).execute(
                role_id=role_id,
                data=request.data,
                actor_id=user.id_usuario,
            )
        except RbacRoleMutationError as exc:
            self._audit(
                request,
                "RBAC_ROLE_UPDATE",
                resource_id=role_id,
                result="FAIL",
                error_code=exc.code,
            )
            return error_response(
                exc.code,
                exc.message,
                exc.status_code,
                details=exc.details,
                request_id=self._request_id(request),
            )

        after = _serialize_role(role)
        if before and before != after:
            touch_users_auth_revision(
                repository.active_user_ids_for_role(role),
                actor_id=user.id_usuario,
            )

        self._audit(
            request,
            "RBAC_ROLE_UPDATE",
            resource_id=role.id_rol,
            before=before,
            after=after,
        )
        return Response({"role": after}, status=status.HTTP_200_OK)


class RbacRoleMutationDeleteView(_RbacRoleMutationBaseView):
    @transaction.atomic
    def delete(self, request, role_id):
        user, auth_error = self.policy_class.authorize(
            request,
            "admin:gestion:roles:delete",
            require_csrf=True,
        )
        if auth_error:
            self._audit(
                request,
                "RBAC_ROLE_DELETE",
                resource_id=role_id,
                result="FAIL",
                error_code=auth_error.data.get("code"),
            )
            return auth_error

        repository = self.repository_class()
        role = repository.get_role(role_id)
        before = _serialize_role(role) if role else None
        active_user_ids = repository.active_user_ids_for_role(role) if role else []

        try:
            role = DeleteRoleMutationUseCase(repository).execute(
                role_id=role_id,
                actor_id=user.id_usuario,
            )
        except RbacRoleMutationError as exc:
            self._audit(
                request,
                "RBAC_ROLE_DELETE",
                resource_id=role_id,
                result="FAIL",
                error_code=exc.code,
            )
            return error_response(
                exc.code,
                exc.message,
                exc.status_code,
                details=exc.details,
                request_id=self._request_id(request),
            )

        touch_users_auth_revision(active_user_ids, actor_id=user.id_usuario)

        self._audit(
            request,
            "RBAC_ROLE_DELETE",
            resource_id=role.id_rol,
            before=before,
            after={"isActive": False},
        )
        return Response({"success": True}, status=status.HTTP_200_OK)
