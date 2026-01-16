"""
AssignRolesToUserUseCase - Lógica de negocio para asignar múltiples roles a un usuario

Responsabilidades:
- Validar que los roles existen y están activos
- Verificar que el usuario existe
- Asignar roles de forma transaccional
- Invalidar cache de permisos del usuario

Reglas de Negocio:
- No duplicar asignaciones (ignora roles ya asignados)
- Si el usuario NO tiene roles, el primer rol se marca como primario
- Permisos requeridos: usuarios:update
"""

from typing import List, Optional, Tuple

from src.infrastructure.authorization.authorization_service import \
    authorization_service
from src.infrastructure.repositories.role_repository import RoleRepository
from src.infrastructure.repositories.user_repository import UserRepository


class AssignRolesToUserUseCase:
    def __init__(
        self,
        user_repo: Optional[UserRepository] = None,
        role_repo: Optional[RoleRepository] = None
    ):
        self.user_repo = user_repo or UserRepository()
        self.role_repo = role_repo or RoleRepository()

    def execute(
        self,
        user_id: int,
        role_ids: List[int],
        modified_by: int
    ) -> Tuple[Optional[dict], Optional[str]]:
        """
        Asigna múltiples roles a un usuario.

        Args:
            user_id: ID del usuario
            role_ids: Lista de IDs de roles a asignar
            modified_by: ID del usuario que realiza la asignación

        Returns:
            Tupla (result, error_code):
            - result: { "assigned_count": int, "user_id": int, "role_ids": List[int] }
            - error_code: Código de error si falla, None si OK

        Códigos de Error:
            - USER_NOT_FOUND: Usuario no existe
            - EMPTY_ROLE_LIST: Lista de roles vacía
            - ROLE_NOT_FOUND: Algún rol no existe o está inactivo
            - DB_CONNECTION_FAILED: Error de conexión
            - ROLE_ASSIGNMENT_FAILED: Error al asignar roles
        """
        # Validación: lista de roles no vacía
        if not role_ids or len(role_ids) == 0:
            return None, "EMPTY_ROLE_LIST"

        # Validación: usuario existe
        user = self.user_repo.get_user_by_id(user_id)
        if not user:
            return None, "USER_NOT_FOUND"

        # Validación: todos los roles existen y están activos
        for role_id in role_ids:
            role = self.role_repo.get_by_id(role_id)
            if not role:
                return None, "ROLE_NOT_FOUND"

        # Asignar roles (operación transaccional)
        assigned_count, error = self.user_repo.assign_roles_to_user(
            user_id=user_id,
            role_ids=role_ids,
            modified_by=modified_by
        )

        if error:
            return None, error

        # Invalidar cache de permisos del usuario (centralizado)
        authorization_service.invalidate_cache(user_id)

        return {
            "assigned_count": assigned_count,
            "user_id": user_id,
            "role_ids": role_ids
        }, None
