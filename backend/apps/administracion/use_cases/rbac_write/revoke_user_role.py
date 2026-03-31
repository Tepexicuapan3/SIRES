from django.utils import timezone

from apps.administracion.models import RelUsuarioRol
from apps.authentication.models import SyUsuario
from apps.authentication.services.auth_revision import touch_user_auth_revision

from .exceptions import RbacWriteError


class RevokeUserRoleUseCase:
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

        relation = (
            RelUsuarioRol.objects.select_related("id_rol")
            .filter(
                id_usuario=user,
                id_rol_id=role_id,
                fch_baja__isnull=True,
            )
            .first()
        )
        if not relation:
            raise RbacWriteError(
                code="ROLE_NOT_FOUND",
                message="Rol no encontrado",
                status_code=404,
                resource_id=user.id_usuario,
                target_user=user,
            )

        active_count = RelUsuarioRol.objects.filter(
            id_usuario=user,
            fch_baja__isnull=True,
        ).count()
        if active_count <= 1:
            raise RbacWriteError(
                code="CANNOT_REMOVE_LAST_ROLE",
                message="El usuario debe conservar al menos un rol",
                status_code=400,
                resource_id=user.id_usuario,
                target_user=user,
            )

        before = serialize_user_roles(user)
        was_primary = relation.is_primary
        relation.fch_baja = timezone.now()
        relation.usr_baja = actor
        relation.is_primary = False
        relation.save(update_fields=["fch_baja", "usr_baja", "is_primary"])

        if was_primary:
            replacement = (
                RelUsuarioRol.objects.filter(id_usuario=user, fch_baja__isnull=True)
                .order_by("id_usuario_rol")
                .first()
            )
            if replacement:
                replacement.is_primary = True
                replacement.save(update_fields=["is_primary"])

        touch_user_auth_revision(user, actor_id=actor.id_usuario)
        payload = {"userId": user.id_usuario, "roles": serialize_user_roles(user)}
        return {
            "target_user": user,
            "before": before,
            "payload": payload,
        }
