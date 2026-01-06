"""
GetUserEffectivePermissionsUseCase - Lógica para obtener permisos efectivos de usuario

Responsabilidades:
- Obtener permisos heredados de roles del usuario
- Aplicar overrides de permisos (DENY > ALLOW > ROLE)
- Filtrar overrides expirados
- Retornar conjunto final de permisos permitidos

Reglas de Negocio:
- DENY siempre gana (bloquea permiso aunque esté en roles)
- ALLOW agrega permiso adicional (no heredado de roles)
- Overrides expirados se ignoran
- Permisos requeridos: usuarios:read
"""

from typing import Optional, Tuple
from src.infrastructure.repositories.permission_repository import PermissionRepository
from src.infrastructure.repositories.user_repository import UserRepository


class GetUserEffectivePermissionsUseCase:
    def __init__(
        self,
        permission_repo: Optional[PermissionRepository] = None,
        user_repo: Optional[UserRepository] = None
    ):
        self.permission_repo = permission_repo or PermissionRepository()
        self.user_repo = user_repo or UserRepository()

    def execute(self, user_id: int) -> Tuple[Optional[dict], Optional[str]]:
        """
        Obtiene permisos efectivos de un usuario (roles + overrides).

        Args:
            user_id: ID del usuario

        Returns:
            Tupla (result, error_code):
            - result: {
                "user_id": int,
                "permissions": ["expedientes:read", "usuarios:create", ...],
                "is_admin": bool,
                "roles": [{"id_rol": 1, "rol": "MEDICOS", ...}],
                "landing_route": "/consultas",
                "overrides": [{"permission_code": "...", "effect": "ALLOW/DENY", ...}]
              }
            - error_code: Código de error si falla, None si OK

        Códigos de Error:
            - USER_NOT_FOUND: Usuario no existe
        """
        # Validación: usuario existe
        user = self.user_repo.get_user_by_id(user_id)
        if not user:
            return None, "USER_NOT_FOUND"

        # Obtener permisos efectivos (ya aplica lógica DENY>ALLOW>ROLE)
        effective = self.permission_repo.get_user_effective_permissions(user_id)

        # Obtener lista de overrides activos (para mostrar en UI)
        overrides = self.permission_repo.get_user_permission_overrides_list(user_id)

        return {
            "user_id": user_id,
            "permissions": effective.get("permissions", []),
            "is_admin": effective.get("is_admin", False),
            "roles": effective.get("roles", []),
            "landing_route": effective.get("landing_route", "/dashboard"),
            "overrides": overrides
        }, None
