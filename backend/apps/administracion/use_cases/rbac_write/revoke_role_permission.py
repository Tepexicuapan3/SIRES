from django.utils import timezone

from apps.administracion.models import RelRolPermiso
from apps.catalogos.models import Roles
from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.auth_revision import touch_users_auth_revision

from ...policies.rbac_write_policy import RbacWritePolicy
from ...services.rbac_permission_rules import split_permission_code
from .exceptions import RbacWriteError


class RevokeRolePermissionUseCase:
    @staticmethod
    def execute(
        *,
        actor,
        role_id,
        permission_id,
        serialize_role_permissions,
        active_user_ids_for_role,
    ):
        role = Roles.objects.filter(id_rol=role_id).first()
        if not role:
            raise RbacWriteError(
                code="ROLE_NOT_FOUND",
                message="Rol no encontrado",
                status_code=404,
                resource_id=role_id,
            )

        actor_permissions = set(UserRepository.build_auth_user(actor).get("permissions", []))
        RbacWritePolicy.validate_role_permission_scope(
            actor=actor,
            role=role,
            actor_permissions=actor_permissions,
        )

        relation = (
            RelRolPermiso.objects.select_related("id_permiso")
            .filter(
                id_rol=role,
                id_permiso_id=permission_id,
                fch_baja__isnull=True,
            )
            .first()
        )
        if not relation:
            raise RbacWriteError(
                code="PERMISSION_NOT_FOUND",
                message="Permiso no encontrado",
                status_code=404,
                resource_id=role.id_rol,
            )

        code = relation.id_permiso.codigo
        resource, action = split_permission_code(code)
        if action == "read" and resource:
            active_relations = RelRolPermiso.objects.select_related("id_permiso").filter(
                id_rol=role,
                fch_baja__isnull=True,
                id_permiso__is_active=True,
            )
            for active in active_relations:
                if active.id_permiso_id == relation.id_permiso_id:
                    continue
                active_resource, active_action = split_permission_code(
                    active.id_permiso.codigo
                )
                if active_resource == resource and active_action in {
                    "create",
                    "update",
                    "delete",
                }:
                    raise RbacWriteError(
                        code="PERMISSION_DEPENDENCY",
                        message="Violacion de dependencia de permisos",
                        status_code=400,
                        resource_id=role.id_rol,
                    )

        before = serialize_role_permissions(role)
        relation.fch_baja = timezone.now()
        relation.usr_baja = actor
        relation.save(update_fields=["fch_baja", "usr_baja"])

        touch_users_auth_revision(
            active_user_ids_for_role(role),
            actor_id=actor.id_usuario,
        )

        payload = {
            "roleId": role.id_rol,
            "permissions": serialize_role_permissions(role),
        }
        return {
            "role": role,
            "before": before,
            "payload": payload,
        }
