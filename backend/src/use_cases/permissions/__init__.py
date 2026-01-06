"""
Use Cases de Permisos - RBAC 2.0

Exporta todos los use cases relacionados con gestión de permisos.
"""

from src.use_cases.permissions.create_permission import CreatePermissionUseCase
from src.use_cases.permissions.update_permission import UpdatePermissionUseCase
from src.use_cases.permissions.delete_permission import DeletePermissionUseCase
from src.use_cases.permissions.get_permissions import GetPermissionsUseCase
from src.use_cases.permissions.assign_permissions_to_role import AssignPermissionsToRoleUseCase

__all__ = [
    "CreatePermissionUseCase",
    "UpdatePermissionUseCase",
    "DeletePermissionUseCase",
    "GetPermissionsUseCase",
    "AssignPermissionsToRoleUseCase",
]
