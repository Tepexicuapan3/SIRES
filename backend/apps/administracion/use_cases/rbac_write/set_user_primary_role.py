from apps.administracion.models import RelUsuarioRol
from apps.authentication.models import SyUsuario
from apps.authentication.services.auth_revision import touch_user_auth_revision

from .exceptions import RbacWriteError


class SetUserPrimaryRoleUseCase:
    @staticmethod
    def execute(*, actor, user_id, role_id, serialize_user_roles):
        user = SyUsuario.objects.select_for_update().filter(id_usuario=user_id).first()
        if not user:
            raise RbacWriteError(
                code="USER_NOT_FOUND",
                message="Usuario no encontrado",
                status_code=404,
                resource_id=user_id,
            )

        if not role_id:
            raise RbacWriteError(
                code="VALIDATION_ERROR",
                message="Datos de entrada invalidos",
                status_code=400,
                details={"roleId": ["Campo requerido"]},
                resource_id=user.id_usuario,
                target_user=user,
            )

        active_relations = list(
            RelUsuarioRol.objects.select_for_update()
            .filter(
                id_usuario=user,
                fch_baja__isnull=True,
            )
            .order_by("id_usuario_rol")
        )
        relation = next(
            (item for item in active_relations if item.id_rol_id == role_id),
            None,
        )
        if not relation:
            raise RbacWriteError(
                code="ROLE_NOT_FOUND",
                message="Rol no encontrado",
                status_code=404,
                resource_id=user.id_usuario,
                target_user=user,
            )

        before = serialize_user_roles(user)
        has_changes = False

        for item in active_relations:
            should_be_primary = item.id_usuario_rol == relation.id_usuario_rol
            if item.is_primary == should_be_primary:
                continue
            item.is_primary = should_be_primary
            item.save(update_fields=["is_primary"])
            has_changes = True

        if has_changes:
            touch_user_auth_revision(user, actor_id=actor.id_usuario)
            user.refresh_from_db(fields=["fch_modf", "usr_modf"])

        payload = {"userId": user.id_usuario, "roles": serialize_user_roles(user)}
        return {
            "target_user": user,
            "before": before,
            "payload": payload,
        }
