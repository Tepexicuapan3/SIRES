from rest_framework import status

from apps.administracion.use_cases.rbac_role_mutation.exceptions import (
    RbacRoleMutationError,
)


class CreateRoleMutationUseCase:
    def __init__(self, repository):
        self.repository = repository

    def execute(self, *, data, actor_id):
        name = data.get("name")
        description = data.get("description")
        landing_route = data.get("landingRoute")

        if not name or not description:
            raise RbacRoleMutationError(
                "VALIDATION_ERROR",
                "Datos de entrada invalidos",
                status.HTTP_400_BAD_REQUEST,
                details={
                    "name": ["Campo requerido"] if not name else [],
                    "description": ["Campo requerido"] if not description else [],
                },
            )

        if self.repository.role_exists_by_name(name):
            raise RbacRoleMutationError(
                "ROLE_EXISTS",
                "El rol ya existe",
                status.HTTP_409_CONFLICT,
            )

        return self.repository.create_role(
            name=name,
            description=description,
            landing_route=landing_route,
            actor_id=actor_id,
        )
