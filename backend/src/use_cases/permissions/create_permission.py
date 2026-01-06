"""
CreatePermissionUseCase - Lógica de negocio para crear un permiso

Responsabilidades:
- Validar datos de entrada (código, resource, action)
- Aplicar reglas de negocio
- Llamar al repository para persistir
"""

import re
from typing import Optional, Dict, Tuple
from src.infrastructure.repositories.permission_repository import PermissionRepository


class CreatePermissionUseCase:
    def __init__(self, permission_repo: Optional[PermissionRepository] = None):
        self.permission_repo = permission_repo or PermissionRepository()

    def execute(
        self,
        code: str,
        resource: str,
        action: str,
        description: Optional[str] = None,
        category: Optional[str] = None,
        usr_alta: str = "system"
    ) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Crea un nuevo permiso custom.

        Args:
            code: Código único (ej: "expedientes:read")
            resource: Recurso (ej: "expedientes")
            action: Acción (ej: "read", "create", "update", "delete")
            description: Descripción del permiso
            category: Categoría para agrupar
            usr_alta: Usuario que crea

        Returns:
            tuple: (permission_dict, error_code)

        Errors:
            - PERMISSION_CODE_REQUIRED: Código vacío
            - PERMISSION_CODE_INVALID: Formato inválido (debe ser resource:action)
            - PERMISSION_CODE_TOO_LONG: Más de 100 caracteres
            - PERMISSION_RESOURCE_REQUIRED: Resource vacío
            - PERMISSION_ACTION_REQUIRED: Action vacío
            - PERMISSION_CODE_EXISTS: Ya existe permiso con ese código
            - DATABASE_ERROR: Error de BD
        """
        # Validación: Código requerido
        if not code or not code.strip():
            return None, "PERMISSION_CODE_REQUIRED"

        code = code.strip().lower()

        # Validación: Formato de código (debe ser resource:action)
        if not re.match(r'^[a-z0-9_-]+:[a-z0-9_-]+$', code):
            return None, "PERMISSION_CODE_INVALID"

        # Validación: Longitud máxima
        if len(code) > 100:
            return None, "PERMISSION_CODE_TOO_LONG"

        # Validación: Resource requerido
        if not resource or not resource.strip():
            return None, "PERMISSION_RESOURCE_REQUIRED"

        resource = resource.strip().lower()

        # Validación: Action requerido
        if not action or not action.strip():
            return None, "PERMISSION_ACTION_REQUIRED"

        action = action.strip().lower()

        # Validación: Código debe ser resource:action
        expected_code = f"{resource}:{action}"
        if code != expected_code:
            return None, "PERMISSION_CODE_MISMATCH"

        # Validación: Descripción (opcional pero si se provee, max 255 chars)
        if description and len(description) > 255:
            return None, "PERMISSION_DESCRIPTION_TOO_LONG"

        # Validación: Categoría (opcional pero si se provee, max 50 chars)
        if category and len(category) > 50:
            return None, "PERMISSION_CATEGORY_TOO_LONG"

        # Llamar al repository
        return self.permission_repo.create_permission(
            code=code,
            resource=resource,
            action=action,
            description=description,
            category=category,
            usr_alta=usr_alta
        )
