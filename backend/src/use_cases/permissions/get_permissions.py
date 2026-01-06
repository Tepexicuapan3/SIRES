"""
GetPermissionsUseCase - Lógica de negocio para obtener permisos

Responsabilidades:
- Obtener lista de permisos
- Obtener detalle de un permiso específico
- Obtener permisos de un rol
"""

from typing import Optional, Dict, List
from src.infrastructure.repositories.permission_repository import PermissionRepository


class GetPermissionsUseCase:
    def __init__(self, permission_repo: Optional[PermissionRepository] = None):
        self.permission_repo = permission_repo or PermissionRepository()

    def get_all(self) -> List[Dict]:
        """
        Obtiene lista de todos los permisos con metadata.

        Returns:
            Lista de permisos
        """
        return self.permission_repo.get_all_permissions()

    def get_by_id(self, permission_id: int) -> Optional[Dict]:
        """
        Obtiene detalle de un permiso específico.

        Args:
            permission_id: ID del permiso

        Returns:
            Dict con datos del permiso o None si no existe
        """
        return self.permission_repo.get_permission_by_id(permission_id)

    def get_by_role_id(self, role_id: int) -> List[Dict]:
        """
        Obtiene permisos asignados a un rol.

        Args:
            role_id: ID del rol

        Returns:
            Lista de permisos del rol
        """
        return self.permission_repo.get_permissions_by_role_id(role_id)
