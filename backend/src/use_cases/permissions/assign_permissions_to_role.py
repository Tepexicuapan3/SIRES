"""
AssignPermissionsToRoleUseCase - Lógica de negocio para asignar permisos a un rol

Responsabilidades:
- Validar que el rol y permisos existen
- Asignar múltiples permisos de forma transaccional
- Invalidar cache de permisos
"""

from typing import List, Tuple
from src.infrastructure.repositories.permission_repository import PermissionRepository
from src.infrastructure.authorization.authorization_service import AuthorizationService


class AssignPermissionsToRoleUseCase:
    def __init__(
        self,
        permission_repo: PermissionRepository = None,
        auth_service: AuthorizationService = None
    ):
        self.permission_repo = permission_repo or PermissionRepository()
        self.auth_service = auth_service or AuthorizationService()

    def execute(
        self,
        role_id: int,
        permission_ids: List[int],
        usr_alta: str = "system"
    ) -> Tuple[bool, str]:
        """
        Asigna múltiples permisos a un rol.

        Args:
            role_id: ID del rol
            permission_ids: Lista de IDs de permisos
            usr_alta: Usuario que asigna

        Returns:
            tuple: (success, error_code)

        Errors:
            - ROLE_NOT_FOUND: Rol no existe
            - INVALID_PERMISSIONS: Uno o más permisos no existen
            - EMPTY_PERMISSION_LIST: Lista vacía
            - DATABASE_ERROR: Error de BD
        """
        # Validación: Lista no vacía
        if not permission_ids:
            return False, "EMPTY_PERMISSION_LIST"

        # Llamar al repository (maneja transacción)
        success, error = self.permission_repo.assign_permissions_to_role(
            role_id=role_id,
            permission_ids=permission_ids,
            usr_alta=usr_alta
        )

        # Si fue exitoso, invalidar cache de permisos
        if success:
            self.auth_service.invalidate_cache()

        return success, error
