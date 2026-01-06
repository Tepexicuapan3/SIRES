"""
CreateRoleUseCase - Lógica de negocio para crear un rol

Responsabilidades:
- Validar datos de entrada
- Aplicar reglas de negocio
- Llamar al repository para persistir
"""

import re
from typing import Optional, Dict, Tuple
from src.infrastructure.repositories.role_repository import RoleRepository


class CreateRoleUseCase:
    def __init__(self, role_repo: Optional[RoleRepository] = None):
        self.role_repo = role_repo or RoleRepository()

    def execute(
        self,
        rol: str,
        desc_rol: str,
        tp_rol: str = "ADMIN",
        landing_route: Optional[str] = None,
        priority: int = 999,
        is_admin: bool = False,
        usr_alta: str = "system"
    ) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Crea un nuevo rol.

        Args:
            rol: Código/nombre del rol (ej: "ENFERMERIA")
            desc_rol: Descripción del rol
            tp_rol: Tipo de rol (default: "ADMIN")
            landing_route: Ruta de destino al login
            priority: Prioridad (menor = mayor prioridad)
            is_admin: Si es rol administrador
            usr_alta: Usuario que crea

        Returns:
            tuple: (role_dict, error_code)

        Errors:
            - ROLE_NAME_REQUIRED: Nombre vacío
            - ROLE_NAME_INVALID: Formato inválido
            - ROLE_NAME_TOO_LONG: Más de 50 caracteres
            - ROLE_DESCRIPTION_REQUIRED: Descripción vacía
            - INVALID_PRIORITY: Priority negativo
            - ROLE_NAME_DUPLICATE: Ya existe rol con ese nombre
            - DATABASE_ERROR: Error de BD
        """
        # Validación: Nombre requerido
        if not rol or not rol.strip():
            return None, "ROLE_NAME_REQUIRED"

        rol = rol.strip().upper()

        # Validación: Formato de nombre (solo letras, números, espacios, guiones)
        if not re.match(r'^[A-Z0-9\s\-_]+$', rol):
            return None, "ROLE_NAME_INVALID"

        # Validación: Longitud máxima
        if len(rol) > 50:
            return None, "ROLE_NAME_TOO_LONG"

        # Validación: Descripción requerida
        if not desc_rol or not desc_rol.strip():
            return None, "ROLE_DESCRIPTION_REQUIRED"

        desc_rol = desc_rol.strip()

        # Validación: Descripción no muy larga
        if len(desc_rol) > 200:
            return None, "ROLE_DESCRIPTION_TOO_LONG"

        # Validación: Priority válido
        if priority < 0:
            return None, "INVALID_PRIORITY"

        # Validación: landing_route opcional pero no vacío si se proporciona
        if landing_route is not None:
            landing_route = landing_route.strip()
            if not landing_route:
                landing_route = None
            elif not landing_route.startswith('/'):
                return None, "INVALID_LANDING_ROUTE"

        # Crear rol
        role, error = self.role_repo.create(
            rol=rol,
            desc_rol=desc_rol,
            tp_rol=tp_rol,
            landing_route=landing_route,
            priority=priority,
            is_admin=is_admin,
            usr_alta=usr_alta
        )

        return role, error
