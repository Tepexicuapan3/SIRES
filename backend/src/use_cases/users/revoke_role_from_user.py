"""
RevokeRoleFromUserUseCase - Lógica de negocio para revocar un rol de un usuario

Responsabilidades:
- Validar que el usuario puede perder el rol (no es el único)
- Revocar rol (soft delete)
- Si es el rol primario, asignar otro como primario automáticamente
- Invalidar cache de permisos

Reglas de Negocio:
- Usuario DEBE tener al menos un rol activo (no se puede revocar el último)
- Si se revoca el rol primario, se asigna automáticamente otro
- Permisos requeridos: usuarios:update
"""

from typing import Optional, Tuple

from src.infrastructure.authorization.authorization_service import \
    authorization_service
from src.infrastructure.repositories.user_repository import UserRepository


class RevokeRoleFromUserUseCase:
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
        Revoca un rol de un usuario.

        Args:
            user_id: ID del usuario
            role_id: ID del rol a revocar
            modified_by: ID del usuario que realiza la revocación

        Returns:
            Tupla (result, error_code):
            - result: { "user_id": int, "role_id": int, "reassigned_primary": bool }
            - error_code: Código de error si falla, None si OK

        Códigos de Error:
            - USER_NOT_FOUND: Usuario no existe
            - CANNOT_REVOKE_LAST_ROLE: No se puede revocar el último rol del usuario
            - ROLE_NOT_ASSIGNED: El rol no está asignado al usuario
            - ROLE_ALREADY_REVOKED: El rol ya está revocado
            - DB_CONNECTION_FAILED: Error de conexión
            - REVOKE_ROLE_FAILED: Error al revocar rol
        """
        # Validación: usuario existe
        user = self.user_repo.get_user_by_id(user_id)
        if not user:
            return None, "USER_NOT_FOUND"

        # Revocar rol (el repository valida que no sea el único)
        success, error = self.user_repo.revoke_role_from_user(
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
            "role_id": role_id,
            "reassigned_primary": True  # El repository ya asignó otro si era primario
        }, None
