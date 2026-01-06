"""
DeleteRoleUseCase - Lógica de negocio para eliminar un rol

Responsabilidades:
- Validar que el rol existe
- Proteger roles del sistema
- Verificar que no tenga usuarios asignados
- Ejecutar baja lógica
"""

from typing import Tuple
from src.infrastructure.repositories.role_repository import RoleRepository


class DeleteRoleUseCase:
    def __init__(self, role_repo: RoleRepository = None):
        self.role_repo = role_repo or RoleRepository()

    def execute(
        self,
        role_id: int,
        usr_baja: str
    ) -> Tuple[bool, str]:
        """
        Elimina un rol (baja lógica).

        Args:
            role_id: ID del rol a eliminar
            usr_baja: Usuario que elimina

        Returns:
            tuple: (success, error_code)

        Errors:
            - ROLE_NOT_FOUND: Rol no existe
            - ROLE_SYSTEM_PROTECTED: Rol del sistema no eliminable (id <= 22)
            - ROLE_HAS_USERS: Rol tiene usuarios asignados
            - DATABASE_ERROR: Error de BD
        """
        # El repository maneja todas las validaciones
        success, error = self.role_repo.delete(
            role_id=role_id,
            usr_baja=usr_baja
        )

        return success, error
