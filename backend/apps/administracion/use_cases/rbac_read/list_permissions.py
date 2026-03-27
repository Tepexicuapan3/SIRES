class ListPermissionsUseCase:
    def __init__(self, repository):
        self.repository = repository

    def execute(self):
        permissions = self.repository.list_permissions()
        return {
            "permissions": permissions,
            "total": len(permissions),
        }
