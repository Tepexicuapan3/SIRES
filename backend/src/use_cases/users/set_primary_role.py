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
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.cache.redis_manager import RedisManager


class SetPrimaryRoleUseCase:
    def __init__(
        self,
        user_repo: Optional[UserRepository] = None,
        redis: Optional[RedisManager] = None
    ):
        self.user_repo = user_repo or UserRepository()
        self.redis = redis or RedisManager()

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

        # Invalidar cache de permisos del usuario
        self._invalidate_user_permissions_cache(user_id)

        return {
            "user_id": user_id,
            "role_id": role_id
        }, None

    def _invalidate_user_permissions_cache(self, user_id: int):
        """
        Invalida el cache de permisos del usuario en Redis.

        Args:
            user_id: ID del usuario
        """
        try:
            cache_key = f"user_permissions:{user_id}"
            self.redis.delete_pattern(cache_key)
        except Exception as e:
            print(f"Warning: Could not invalidate cache for user {user_id}: {e}")
