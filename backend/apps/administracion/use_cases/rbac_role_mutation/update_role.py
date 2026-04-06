from django.utils import timezone
from rest_framework import status

from apps.administracion.use_cases.rbac_role_mutation.exceptions import (
    RbacRoleMutationError,
)


class UpdateRoleMutationUseCase:
    def __init__(self, repository):
        self.repository = repository

    def execute(self, *, role_id, data, actor_id):
        role = self.repository.get_role(role_id)
        if not role:
            raise RbacRoleMutationError(
                "ROLE_NOT_FOUND",
                "Rol no encontrado",
                status.HTTP_404_NOT_FOUND,
            )

        if role.es_sistema:
            raise RbacRoleMutationError(
                "ROLE_SYSTEM_PROTECTED",
                "El rol de sistema no puede modificarse",
                status.HTTP_403_FORBIDDEN,
            )

        name = data.get("name")
        if name and self.repository.role_exists_by_name(name, exclude_role_id=role.id_rol):
            raise RbacRoleMutationError(
                "ROLE_EXISTS",
                "El rol ya existe",
                status.HTTP_409_CONFLICT,
            )

        if "name" in data:
            role.rol = name
        if "description" in data:
            role.desc_rol = data.get("description")
        if "landingRoute" in data:
            role.landing_route = data.get("landingRoute")
        if "isActive" in data:
            role.is_active = bool(data.get("isActive"))

        role.updated_at = timezone.now()
        role.updated_by_id = actor_id
        role.save()
        return role
