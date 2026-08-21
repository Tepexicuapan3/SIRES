import uuid

from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.csrf_service import validate_csrf
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.response_service import error_response, get_request_id
from apps.authentication.services.session_service import authenticate_request
from rest_framework import status

from ..use_cases.navigation.exceptions import (
    NavigationModuleSystemProtectedError,
    NavigationPermissionGrantNotAllowedError,
)


class NavigationModuleMutationPolicy:
    """
    Calca `RbacRoleMutationPolicy.authorize` (autenticacion + permiso
    puntual + CSRF opcional) y suma dos guardas de negocio invocadas DESDE
    los use cases -- mismo patron que `RbacWritePolicy.validate_role_permission_scope`,
    que tampoco se llama desde la view sino desde `AssignRolePermissionsUseCase`.
    """

    @staticmethod
    def authorize(request, permission_code, require_csrf=False):
        request_id = str(uuid.uuid4())
        if hasattr(request, "headers"):
            request_id = get_request_id(request) or request_id

        try:
            user = authenticate_request(request)
        except AuthServiceError as exc:
            return None, error_response(
                exc.code,
                exc.message,
                exc.status_code,
                details=exc.details,
                request_id=request_id,
            )

        request.user = user
        request.request_id = request_id

        permissions = UserRepository.build_auth_user(user).get("permissions", [])
        if "*" not in permissions and permission_code not in permissions:
            return user, error_response(
                "PERMISSION_DENIED",
                "No tienes permiso para esta accion",
                status.HTTP_403_FORBIDDEN,
                request_id=request_id,
            )

        if require_csrf and not validate_csrf(request):
            return user, error_response(
                "PERMISSION_DENIED",
                "No tienes permiso para esta accion",
                status.HTTP_403_FORBIDDEN,
                request_id=request_id,
            )

        return user, None

    @staticmethod
    def assert_not_system(modulo):
        """
        Bloquea ocultar/mover un nodo `es_sistema=True`. El caller decide
        CUANDO llamar esto (hide valida el subarbol completo, move valida
        solo el nodo movido -- ver `HideModuleUseCase`/`MoveModuleUseCase`).
        """
        if modulo.es_sistema:
            raise NavigationModuleSystemProtectedError(clave=modulo.clave)

    @staticmethod
    def assert_can_grant(*, codes, actor_permissions):
        """
        Replica `PERMISSION_GRANT_NOT_ALLOWED` de `RbacWritePolicy`: nadie
        puede asociar a un modulo un codigo de permiso que su propio actor
        no posee (evita que un admin exponga un modulo con un permiso fuera
        de su propio scope). Wildcard `*` bypassea el chequeo.
        """
        if not codes or "*" in actor_permissions:
            return
        disallowed = sorted(code for code in codes if code not in actor_permissions)
        if disallowed:
            raise NavigationPermissionGrantNotAllowedError(disallowed)
