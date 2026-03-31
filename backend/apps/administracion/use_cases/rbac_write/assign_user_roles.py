from apps.administracion.models import RelUsuarioRol
from apps.authentication.models import SyUsuario
from apps.authentication.services.auth_revision import touch_user_auth_revision
from apps.catalogos.models import Roles

from .exceptions import RbacWriteError


class AssignUserRolesUseCase:
    @staticmethod
    def execute(*, actor, user_id, role_ids, serialize_user_roles):
        user = SyUsuario.objects.filter(id_usuario=user_id).first()
        if not user:
            raise RbacWriteError(
                code="USER_NOT_FOUND",
                message="Usuario no encontrado",
                status_code=404,
                resource_id=user_id,
            )

        if not isinstance(role_ids, list) or not role_ids:
            raise RbacWriteError(
                code="VALIDATION_ERROR",
                message="Datos de entrada invalidos",
                status_code=400,
                details={"roleIds": ["Debe ser un arreglo no vacio"]},
                resource_id=user.id_usuario,
                target_user=user,
            )

        roles = {
            role.id_rol: role
            for role in Roles.objects.filter(id_rol__in=role_ids, is_active=True)
        }
        missing = sorted(set(role_ids) - set(roles.keys()))
        if missing:
            raise RbacWriteError(
                code="ROLE_NOT_FOUND",
                message="Rol no encontrado",
                status_code=404,
                details={
                    "roleIds": [
                        f"No existen: {', '.join(str(value) for value in missing)}"
                    ]
                },
                resource_id=user.id_usuario,
                target_user=user,
            )

        before = serialize_user_roles(user)
        has_role_changes = False

        for role_id in role_ids:
            role = roles[role_id]
            relation = RelUsuarioRol.objects.filter(id_usuario=user, id_rol=role).first()
            if relation:
                if relation.fch_baja is not None:
                    relation.fch_baja = None
                    relation.usr_baja = None
                    relation.save(update_fields=["fch_baja", "usr_baja"])
                    has_role_changes = True
                continue
            RelUsuarioRol.objects.create(
                id_usuario=user,
                id_rol=role,
                is_primary=False,
                usr_asignacion=actor,
            )
            has_role_changes = True

        has_primary = RelUsuarioRol.objects.filter(
            id_usuario=user,
            fch_baja__isnull=True,
            is_primary=True,
        ).exists()
        if not has_primary:
            first_relation = (
                RelUsuarioRol.objects.filter(id_usuario=user, fch_baja__isnull=True)
                .order_by("id_usuario_rol")
                .first()
            )
            if first_relation and not first_relation.is_primary:
                first_relation.is_primary = True
                first_relation.save(update_fields=["is_primary"])
                has_role_changes = True

        if has_role_changes:
            touch_user_auth_revision(user, actor_id=actor.id_usuario)

        payload = {"userId": user.id_usuario, "roles": serialize_user_roles(user)}
        return {
            "target_user": user,
            "before": before,
            "payload": payload,
        }
