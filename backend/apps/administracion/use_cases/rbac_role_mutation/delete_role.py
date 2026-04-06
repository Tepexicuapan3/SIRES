from django.utils import timezone
from rest_framework import status

from apps.administracion.use_cases.rbac_role_mutation.exceptions import (
    RbacRoleMutationError,
)


class DeleteRoleMutationUseCase:
    def __init__(self, repository):
        self.repository = repository

    def execute(self, *, role_id, actor_id):
        role = self.repository.get_role(role_id)
        if not role:
            raise RbacRoleMutationError(
                "ROLE_NOT_FOUND",
                "Rol no encontrado",
                status.HTTP_404_NOT_FOUND,
            )

        if role.es_sistema:
            raise RbacRoleMutationError(
                "CANNOT_DELETE_SYSTEM_ROLE",
                "No se puede eliminar un rol de sistema",
                status.HTTP_400_BAD_REQUEST,
            )

        if self.repository.has_active_users(role):
            raise RbacRoleMutationError(
                "ROLE_HAS_USERS",
                "El rol tiene usuarios activos asignados",
                status.HTTP_400_BAD_REQUEST,
            )

        role.is_active = False
        role.deleted_at = timezone.now()
        role.deleted_by_id = actor_id
        role.save(update_fields=["is_active", "deleted_at", "deleted_by_id"])
        return role
