"""
DeletePermissionUseCase - Lógica de negocio para eliminar un permiso

Responsabilidades:
- Validar que el permiso puede ser eliminado
- Llamar al repository para baja lógica
"""

from typing import Tuple
from src.infrastructure.repositories.permission_repository import PermissionRepository


class DeletePermissionUseCase:
    def __init__(self, permission_repo: PermissionRepository = None):
        self.permission_repo = permission_repo or PermissionRepository()

    def execute(
        self,
        permission_id: int,
        usr_baja: str = "system"
    ) -> Tuple[bool, str]:
        """
        Elimina un permiso custom (baja lógica).

        Args:
            permission_id: ID del permiso
            usr_baja: Usuario que elimina

        Returns:
            tuple: (success, error_code)

        Errors:
            - PERMISSION_NOT_FOUND: Permiso no existe
            - PERMISSION_SYSTEM_PROTECTED: Permiso del sistema no eliminable
            - PERMISSION_IN_USE: Permiso asignado a roles
            - DATABASE_ERROR: Error de BD
        """
        # El repository maneja todas las validaciones
        return self.permission_repo.delete_permission(
            permission_id=permission_id,
            usr_baja=usr_baja
        )
