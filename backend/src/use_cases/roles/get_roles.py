"""
GetRolesUseCase - Lógica de negocio para obtener roles

Responsabilidades:
- Obtener lista de roles con metadata
- Obtener detalle de un rol específico
"""

from typing import Optional, Dict, List
from src.infrastructure.repositories.role_repository import RoleRepository


class GetRolesUseCase:
    def __init__(self, role_repo: Optional[RoleRepository] = None):
        self.role_repo = role_repo or RoleRepository()

    def get_all(self, include_inactive: bool = False) -> List[Dict]:
        """
        Obtiene lista de todos los roles con counts de permisos y usuarios.

        Args:
            include_inactive: Si incluir roles inactivos (est_rol='B')

        Returns:
            Lista de roles con metadata
        """
        return self.role_repo.get_all(include_inactive=include_inactive)

    def get_by_id(self, role_id: int) -> Optional[Dict]:
        """
        Obtiene detalle de un rol específico.

        Args:
            role_id: ID del rol

        Returns:
            Dict con datos del rol o None si no existe
        """
        return self.role_repo.get_by_id(role_id)
