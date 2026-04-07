import uuid
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.administracion.policies.rbac_read_policy import RbacReadPolicy
from apps.administracion.repositories.rbac_read_repository import RbacReadRepository
from apps.administracion.services.audit_service import AuditService
from apps.administracion.services.rbac_read_serializers import (
    serialize_permission_catalog,
    serialize_role_detail,
    serialize_role_list,
)
from apps.administracion.use_cases.rbac_read.exceptions import (
    RbacReadNotFoundError,
    RbacReadValidationError,
)
from apps.administracion.use_cases.rbac_read.get_role_detail import GetRoleDetailUseCase
from apps.administracion.use_cases.rbac_read.list_permissions import (
    ListPermissionsUseCase,
)
from apps.administracion.use_cases.rbac_read.list_roles import ListRolesUseCase
from apps.administracion.services.rbac_feature_flags import resolve_rbac_read_source
from apps.authentication.services.response_service import error_response, get_request_id


def resolve_read_source():
    return resolve_rbac_read_source()


def _request_id(request):
    return get_request_id(request) or str(uuid.uuid4())


def _parse_pagination(request):
    raw_page = request.query_params.get("page", "1")
    raw_page_size = request.query_params.get("pageSize", "20")

    try:
        page = int(raw_page)
        page_size = int(raw_page_size)
    except (TypeError, ValueError):
        return (
            None,
            None,
            error_response(
                "INVALID_FORMAT",
                "Parametros de paginacion invalidos",
                status.HTTP_400_BAD_REQUEST,
                details={
                    "page": ["Debe ser un entero"],
                    "pageSize": ["Debe ser un entero"],
                },
                request_id=_request_id(request),
            ),
        )

    if page < 1 or page_size < 1 or page_size > 100:
        return (
            None,
            None,
            error_response(
                "VALIDATION_ERROR",
                "Parametros de paginacion fuera de rango",
                status.HTTP_400_BAD_REQUEST,
                details={
                    "page": ["Debe ser mayor o igual a 1"],
                    "pageSize": ["Debe estar entre 1 y 100"],
                },
                request_id=_request_id(request),
            ),
        )

    return page, page_size, None


class _RbacReadBaseView(APIView):
    authentication_classes = []
    permission_classes = []

    repository_class = RbacReadRepository

    def _audit(
        self,
        request,
        action,
        resource_type,
        *,
        resource_id=None,
        result="SUCCESS",
        error_code=None,
    ):
        AuditService.log_event(
            request=request,
            accion=action,
            recurso_tipo=resource_type,
            recurso_id=resource_id,
            resultado=result,
            codigo_error=error_code,
            metadata={"source": "s1", "domain": "auth_access"},
        )


class RbacReadRolesListView(_RbacReadBaseView):
    def get(self, request):
        _, auth_error = RbacReadPolicy.authorize(request, "admin:gestion:roles:read")
        if auth_error:
            self._audit(
                request,
                "RBAC_ROLE_LIST",
                "role",
                result="FAIL",
                error_code=auth_error.data.get("code"),
            )
            return auth_error

        page, page_size, pagination_error = _parse_pagination(request)
        if pagination_error:
            self._audit(
                request,
                "RBAC_ROLE_LIST",
                "role",
                result="FAIL",
                error_code="VALIDATION_ERROR",
            )
            return pagination_error

        use_case = ListRolesUseCase(self.repository_class())
        try:
            data = use_case.execute(
                page=page,
                page_size=page_size,
                search=request.query_params.get("search"),
                is_active_raw=request.query_params.get("isActive"),
                is_system_raw=request.query_params.get("isSystem"),
                sort_by=request.query_params.get("sortBy", "name"),
                sort_order=request.query_params.get("sortOrder", "asc"),
            )
        except RbacReadValidationError as exc:
            self._audit(
                request, "RBAC_ROLE_LIST", "role", result="FAIL", error_code=exc.code
            )
            return error_response(
                exc.code,
                exc.message,
                status.HTTP_400_BAD_REQUEST,
                details=exc.details,
                request_id=_request_id(request),
            )

        payload = serialize_role_list(data, self.repository_class())
        self._audit(request, "RBAC_ROLE_LIST", "role", result="SUCCESS")
        return Response(payload, status=status.HTTP_200_OK)


class RbacReadRoleDetailView(_RbacReadBaseView):
    def get(self, request, role_id):
        _, auth_error = RbacReadPolicy.authorize(request, "admin:gestion:roles:read")
        if auth_error:
            self._audit(
                request,
                "RBAC_ROLE_DETAIL",
                "role",
                resource_id=role_id,
                result="FAIL",
                error_code=auth_error.data.get("code"),
            )
            return auth_error

        use_case = GetRoleDetailUseCase(self.repository_class())
        try:
            data = use_case.execute(role_id=role_id)
        except RbacReadNotFoundError as exc:
            self._audit(
                request,
                "RBAC_ROLE_DETAIL",
                "role",
                resource_id=role_id,
                result="FAIL",
                error_code=exc.code,
            )
            return error_response(
                exc.code,
                exc.message,
                status.HTTP_404_NOT_FOUND,
                request_id=_request_id(request),
            )

        payload = serialize_role_detail(data)
        self._audit(
            request, "RBAC_ROLE_DETAIL", "role", resource_id=role_id, result="SUCCESS"
        )
        return Response(payload, status=status.HTTP_200_OK)


class RbacReadPermissionsCatalogView(_RbacReadBaseView):
    def get(self, request):
        _, auth_error = RbacReadPolicy.authorize(request, "admin:gestion:permisos:read")
        if auth_error:
            self._audit(
                request,
                "RBAC_PERMISSION_LIST",
                "permission",
                result="FAIL",
                error_code=auth_error.data.get("code"),
            )
            return auth_error

        data = ListPermissionsUseCase(self.repository_class()).execute()
        payload = serialize_permission_catalog(data)
        self._audit(request, "RBAC_PERMISSION_LIST", "permission", result="SUCCESS")
        return Response(payload, status=status.HTTP_200_OK)
