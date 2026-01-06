"""
RemoveUserPermissionOverrideUseCase - Lógica de negocio para eliminar override de permiso

Responsabilidades:
- Validar que el permiso existe
- Validar que el usuario existe
- Eliminar override (soft delete)
- Invalidar cache de permisos del usuario

Reglas de Negocio:
- Solo se puede eliminar un override existente y activo
- Permisos requeridos: usuarios:update
"""

from typing import Optional, Tuple
from src.infrastructure.repositories.permission_repository import PermissionRepository
from src.infrastructure.repositories.user_repository import UserRepository
from src.infrastructure.cache.redis_manager import RedisManager


class RemoveUserPermissionOverrideUseCase:
    def __init__(
        self,
        permission_repo: Optional[PermissionRepository] = None,
        user_repo: Optional[UserRepository] = None,
        redis: Optional[RedisManager] = None
    ):
        self.permission_repo = permission_repo or PermissionRepository()
        self.user_repo = user_repo or UserRepository()
        self.redis = redis or RedisManager()

    def execute(
        self,
        user_id: int,
        permission_code: str,
        usr_baja: str
    ) -> Tuple[Optional[dict], Optional[str]]:
        """
        Elimina un override de permiso de un usuario.

        Args:
            user_id: ID del usuario
            permission_code: Código del permiso (ej: "expedientes:read")
            usr_baja: Usuario que elimina el override

        Returns:
            Tupla (result, error_code):
            - result: { "user_id": int, "permission_code": str }
            - error_code: Código de error si falla, None si OK

        Códigos de Error:
            - USER_NOT_FOUND: Usuario no existe
            - PERMISSION_NOT_FOUND: Permiso no existe
            - OVERRIDE_NOT_FOUND: Override no existe
            - OVERRIDE_ALREADY_DELETED: Override ya fue eliminado
            - DB_CONNECTION_FAILED: Error de conexión
            - OVERRIDE_DELETION_FAILED: Error al eliminar override
        """
        # Validación: usuario existe
        user = self.user_repo.get_user_by_id(user_id)
        if not user:
            return None, "USER_NOT_FOUND"

        # Validación: permiso existe
        permission = self.permission_repo.get_permission_by_code(permission_code)
        if not permission:
            return None, "PERMISSION_NOT_FOUND"

        # Eliminar override
        success, error = self.permission_repo.remove_user_permission_override(
            user_id=user_id,
            permission_id=permission['id_permission'],
            usr_baja=usr_baja
        )

        if error:
            return None, error

        # Invalidar cache de permisos del usuario
        self._invalidate_user_permissions_cache(user_id)

        return {
            "user_id": user_id,
            "permission_code": permission_code
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
