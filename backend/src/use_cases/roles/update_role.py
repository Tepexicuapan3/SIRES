"""
UpdateRoleUseCase - Lógica de negocio para actualizar un rol

Responsabilidades:
- Validar datos de entrada
- Proteger roles del sistema
- Aplicar reglas de negocio
"""

import re
from typing import Optional, Dict, Tuple
from src.infrastructure.repositories.role_repository import RoleRepository


class UpdateRoleUseCase:
    def __init__(self, role_repo: Optional[RoleRepository] = None):
        self.role_repo = role_repo or RoleRepository()

    def execute(
        self,
        role_id: int,
        usr_modf: str,
        **kwargs
    ) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Actualiza un rol existente.

        Args:
            role_id: ID del rol a actualizar
            usr_modf: Usuario que modifica
            **kwargs: Campos a actualizar (rol, desc_rol, landing_route, priority)

        Returns:
            tuple: (role_dict, error_code)

        Errors:
            - ROLE_NOT_FOUND: Rol no existe
            - ROLE_SYSTEM_PROTECTED: Rol del sistema no editable
            - ROLE_NAME_INVALID: Formato inválido
            - ROLE_NAME_TOO_LONG: Más de 50 caracteres
            - ROLE_NAME_DUPLICATE: Ya existe otro rol con ese nombre
            - INVALID_PRIORITY: Priority negativo
            - NO_FIELDS_TO_UPDATE: No se proporcionó ningún campo
            - DATABASE_ERROR: Error de BD
        """
        # Validar que haya algo para actualizar
        if not kwargs:
            return None, "NO_FIELDS_TO_UPDATE"

        # Validar campos si se proporcionan
        if 'rol' in kwargs:
            rol = kwargs['rol'].strip().upper() if kwargs['rol'] else None
            if not rol:
                return None, "ROLE_NAME_REQUIRED"
            
            if not re.match(r'^[A-Z0-9\s\-_]+$', rol):
                return None, "ROLE_NAME_INVALID"
            
            if len(rol) > 50:
                return None, "ROLE_NAME_TOO_LONG"
            
            kwargs['rol'] = rol

        if 'desc_rol' in kwargs:
            desc_rol = kwargs['desc_rol'].strip() if kwargs['desc_rol'] else None
            if not desc_rol:
                return None, "ROLE_DESCRIPTION_REQUIRED"
            
            if len(desc_rol) > 200:
                return None, "ROLE_DESCRIPTION_TOO_LONG"
            
            kwargs['desc_rol'] = desc_rol

        if 'priority' in kwargs:
            priority = kwargs['priority']
            if priority < 0:
                return None, "INVALID_PRIORITY"

        if 'landing_route' in kwargs:
            landing_route = kwargs['landing_route']
            if landing_route is not None:
                landing_route = landing_route.strip()
                if not landing_route:
                    kwargs['landing_route'] = None
                elif not landing_route.startswith('/'):
                    return None, "INVALID_LANDING_ROUTE"
                else:
                    kwargs['landing_route'] = landing_route

        # Actualizar en repository
        role, error = self.role_repo.update(
            role_id=role_id,
            usr_modf=usr_modf,
            **kwargs
        )

        return role, error
