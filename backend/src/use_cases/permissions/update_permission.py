"""
UpdatePermissionUseCase - Lógica de negocio para actualizar un permiso

Responsabilidades:
- Validar que el permiso existe y no es del sistema
- Validar datos de entrada
- Llamar al repository para actualizar
"""

from typing import Optional, Dict, Tuple
from src.infrastructure.repositories.permission_repository import PermissionRepository


class UpdatePermissionUseCase:
    def __init__(self, permission_repo: Optional[PermissionRepository] = None):
        self.permission_repo = permission_repo or PermissionRepository()

    def execute(
        self,
        permission_id: int,
        description: Optional[str] = None,
        category: Optional[str] = None,
        usr_modf: str = "system"
    ) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Actualiza un permiso custom (solo descripción y categoría).

        Args:
            permission_id: ID del permiso
            description: Nueva descripción
            category: Nueva categoría
            usr_modf: Usuario que modifica

        Returns:
            tuple: (permission_dict, error_code)

        Errors:
            - PERMISSION_NOT_FOUND: Permiso no existe
            - PERMISSION_SYSTEM_PROTECTED: Permiso del sistema no editable
            - PERMISSION_DESCRIPTION_TOO_LONG: Descripción >255 caracteres
            - PERMISSION_CATEGORY_TOO_LONG: Categoría >50 caracteres
            - DATABASE_ERROR: Error de BD
        """
        # Validación: Descripción (si se provee, max 255 chars)
        if description and len(description) > 255:
            return None, "PERMISSION_DESCRIPTION_TOO_LONG"

        # Validación: Categoría (si se provee, max 50 chars)
        if category and len(category) > 50:
            return None, "PERMISSION_CATEGORY_TOO_LONG"

        # Llamar al repository (él valida que exista y no sea del sistema)
        return self.permission_repo.update_permission(
            permission_id=permission_id,
            description=description,
            category=category,
            usr_modf=usr_modf
        )
