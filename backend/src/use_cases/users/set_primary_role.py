"""
SetPrimaryRoleUseCase - Lógica de negocio para cambiar el rol primario de un usuario

Responsabilidades:
- Validar que el rol está asignado al usuario
- Cambiar el rol primario (solo uno puede ser primario)
- Invalidar cache de permisos

Reglas de Negocio:
- El rol DEBE estar ya asignado al usuario
- Solo un rol puede ser primario a la vez
- Permisos requeridos: usuarios:update
"""

from typing import Optional, Tuple

from src.infrastructure.authorization.authorization_service import \
    authorization_service
from src.infrastructure.repositories.user_repository import UserRepository


class SetPrimaryRoleUseCase:
    def __init__(
        self,
        user_repo: Optional[UserRepository] = None
    ):
        self.user_repo = user_repo or UserRepository()

    def execute(
        self,
        user_id: int,
        role_id: int,
        modified_by: int
    ) -> Tuple[Optional[dict], Optional[str]]:
        """
        Marca un rol como primario para un usuario.

        Args:
            user_id: ID del usuario
            role_id: ID del rol a marcar como primario
            modified_by: ID del usuario que realiza el cambio

        Returns:
            Tupla (result, error_code):
            - result: { "user_id": int, "role_id": int }
            - error_code: Código de error si falla, None si OK

        Códigos de Error:
            - USER_NOT_FOUND: Usuario no existe
            - ROLE_NOT_ASSIGNED: El rol no está asignado al usuario
            - ROLE_INACTIVE: El rol está revocado (est_usr_rol = 'B')
            - DB_CONNECTION_FAILED: Error de conexión
            - SET_PRIMARY_FAILED: Error al cambiar rol primario
        """
        # Validación: usuario existe
        user = self.user_repo.get_user_by_id(user_id)
        if not user:
            return None, "USER_NOT_FOUND"

        # Cambiar rol primario (el repository valida que el rol esté asignado)
        success, error = self.user_repo.set_primary_role(
            user_id=user_id,
            role_id=role_id,
            modified_by=modified_by
        )

        if error:
            return None, error

        # Invalidar cache de permisos del usuario (centralizado)
        authorization_service.invalidate_cache(user_id)

        return {
            "user_id": user_id,
            "role_id": role_id
        }, None
