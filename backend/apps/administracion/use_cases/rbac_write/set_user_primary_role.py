from apps.administracion.models import RelUsuarioRol
from apps.authentication.models import SyUsuario
from apps.authentication.services.auth_revision import touch_user_auth_revision

from .exceptions import RbacWriteError


class SetUserPrimaryRoleUseCase:
    @staticmethod
    def execute(*, actor, user_id, role_id, serialize_user_roles):
        user = SyUsuario.objects.filter(id_usuario=user_id).first()
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

        relation = RelUsuarioRol.objects.filter(
            id_usuario=user,
            id_rol_id=role_id,
            fch_baja__isnull=True,
        ).first()
        if not relation:
            raise RbacWriteError(
                code="ROLE_NOT_FOUND",
                message="Rol no encontrado",
                status_code=404,
                resource_id=user.id_usuario,
                target_user=user,
            )

        before = serialize_user_roles(user)

        RelUsuarioRol.objects.filter(id_usuario=user, fch_baja__isnull=True).update(
            is_primary=False
        )
        relation.is_primary = True
        relation.save(update_fields=["is_primary"])

        touch_user_auth_revision(user, actor_id=actor.id_usuario)
        user.refresh_from_db(fields=["fch_modf", "usr_modf"])

        payload = {"userId": user.id_usuario, "roles": serialize_user_roles(user)}
        return {
            "target_user": user,
            "before": before,
            "payload": payload,
        }
