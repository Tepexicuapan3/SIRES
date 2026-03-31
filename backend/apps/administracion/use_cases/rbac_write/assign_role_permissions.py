from apps.administracion.models import RelRolPermiso
from apps.catalogos.models import Permisos, Roles
from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.auth_revision import touch_users_auth_revision
from django.utils import timezone

from ...services.rbac_permission_rules import ensure_read_dependencies
from ...policies.rbac_write_policy import RbacWritePolicy
from .exceptions import RbacWriteError


class AssignRolePermissionsUseCase:
    @staticmethod
    def execute(*, actor, role_id, permission_ids, serialize_role_permissions, active_user_ids_for_role):
        if role_id is None or not isinstance(permission_ids, list):
            raise RbacWriteError(
                code="VALIDATION_ERROR",
                message="Datos de entrada invalidos",
                status_code=400,
                details={
                    "roleId": ["Campo requerido"],
                    "permissionIds": ["Debe ser un arreglo"],
                },
            )

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

        requested_ids = ensure_read_dependencies(set(permission_ids))
        permissions = {
            permission.id_permiso: permission
            for permission in Permisos.objects.filter(
                id_permiso__in=requested_ids,
                is_active=True,
            )
        }
        missing_ids = sorted(requested_ids - set(permissions.keys()))
        if missing_ids:
            raise RbacWriteError(
                code="PERMISSION_NOT_FOUND",
                message="Permiso no encontrado",
                status_code=404,
                details={
                    "permissionIds": [
                        f"No existen: {', '.join(str(value) for value in missing_ids)}"
                    ]
                },
                resource_id=role.id_rol,
            )

        requested_codes = {permission.codigo for permission in permissions.values()}
        RbacWritePolicy.validate_role_permission_scope(
            actor=actor,
            role=role,
            actor_permissions=actor_permissions,
            requested_codes=requested_codes,
        )

        before = serialize_role_permissions(role)
        relations = {
            relation.id_permiso_id: relation
            for relation in RelRolPermiso.objects.filter(id_rol=role)
        }
        has_permission_changes = False

        for permission_id in requested_ids:
            relation = relations.get(permission_id)
            if relation:
                if relation.fch_baja is not None:
                    relation.fch_baja = None
                    relation.usr_baja = None
                    relation.save(update_fields=["fch_baja", "usr_baja"])
                    has_permission_changes = True
                continue

            RelRolPermiso.objects.create(
                id_rol=role,
                id_permiso=permissions[permission_id],
                usr_asignacion=actor,
            )
            has_permission_changes = True

        for permission_id, relation in relations.items():
            if permission_id in requested_ids:
                continue
            if relation.fch_baja is None:
                relation.fch_baja = timezone.now()
                relation.usr_baja = actor
                relation.save(update_fields=["fch_baja", "usr_baja"])
                has_permission_changes = True

        if has_permission_changes:
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
