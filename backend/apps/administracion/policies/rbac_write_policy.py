from rest_framework import status

from ..models import RelUsuarioRol
from ..use_cases.rbac_write.exceptions import RbacWriteError


class RbacWritePolicy:
    @staticmethod
    def validate_role_permission_scope(
        *,
        actor,
        role,
        actor_permissions,
        requested_codes=None,
    ):
        has_wildcard = "*" in actor_permissions

        if role.es_sistema and not has_wildcard:
            raise RbacWriteError(
                code="ROLE_SYSTEM_PROTECTED",
                message="No puedes modificar permisos de un rol de sistema",
                status_code=status.HTTP_403_FORBIDDEN,
                resource_id=role.id_rol,
            )

        if role.is_admin and not has_wildcard:
            raise RbacWriteError(
                code="ROLE_ADMIN_PROTECTED",
                message="No puedes modificar permisos de un rol administrador",
                status_code=status.HTTP_403_FORBIDDEN,
                resource_id=role.id_rol,
            )

        has_role_assigned = RelUsuarioRol.objects.filter(
            id_usuario=actor,
            id_rol=role,
            fch_baja__isnull=True,
        ).exists()
        if has_role_assigned and not has_wildcard:
            raise RbacWriteError(
                code="SELF_ROLE_PERMISSION_ASSIGNMENT_FORBIDDEN",
                message="No puedes modificar permisos de tus propios roles",
                status_code=status.HTTP_403_FORBIDDEN,
                resource_id=role.id_rol,
            )

        if requested_codes and not has_wildcard:
            disallowed_codes = sorted(
                code for code in requested_codes if code not in actor_permissions
            )
            if disallowed_codes:
                raise RbacWriteError(
                    code="PERMISSION_GRANT_NOT_ALLOWED",
                    message="No puedes asignar permisos que no tienes",
                    status_code=status.HTTP_403_FORBIDDEN,
                    details={"permissionCodes": disallowed_codes},
                    resource_id=role.id_rol,
                )

    @staticmethod
    def validate_user_override_scope(*, actor, target_user, permission, actor_permissions):
        has_wildcard = "*" in actor_permissions

        if permission.es_sistema and not has_wildcard:
            raise RbacWriteError(
                code="PERMISSION_SYSTEM_PROTECTED",
                message="No puedes gestionar overrides para un permiso de sistema",
                status_code=status.HTTP_403_FORBIDDEN,
                resource_id=target_user.id_usuario,
                target_user=target_user,
            )

        if target_user.id_usuario == actor.id_usuario and not has_wildcard:
            raise RbacWriteError(
                code="SELF_OVERRIDE_FORBIDDEN",
                message="No puedes gestionar overrides sobre tu propio usuario",
                status_code=status.HTTP_403_FORBIDDEN,
                resource_id=target_user.id_usuario,
                target_user=target_user,
            )

        if permission.codigo not in actor_permissions and not has_wildcard:
            raise RbacWriteError(
                code="PERMISSION_GRANT_NOT_ALLOWED",
                message="No puedes gestionar overrides para permisos que no tienes",
                status_code=status.HTTP_403_FORBIDDEN,
                details={"permissionCodes": [permission.codigo]},
                resource_id=target_user.id_usuario,
                target_user=target_user,
            )
