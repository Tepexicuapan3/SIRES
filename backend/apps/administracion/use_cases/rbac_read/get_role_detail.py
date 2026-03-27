from apps.administracion.use_cases.rbac_read.exceptions import RbacReadNotFoundError


class GetRoleDetailUseCase:
    def __init__(self, repository):
        self.repository = repository

    def execute(self, *, role_id):
        role = self.repository.get_role(role_id)
        if not role:
            raise RbacReadNotFoundError("ROLE_NOT_FOUND", "Rol no encontrado")

        return {
            "role": role,
            "permissions": self.repository.list_role_permissions(role),
            "permissions_count": self.repository.count_role_permissions(role),
            "users_count": self.repository.count_role_users(role),
        }
