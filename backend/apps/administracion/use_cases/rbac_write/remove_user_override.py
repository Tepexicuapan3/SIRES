from django.utils import timezone
from rest_framework import status

from apps.administracion.models import RelUsuarioOverride
from apps.authentication.models import SyUsuario
from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.auth_revision import touch_user_auth_revision

from ...policies.rbac_write_policy import RbacWritePolicy
from .exceptions import RbacWriteError


class RemoveUserOverrideUseCase:
    @staticmethod
    def execute(*, actor, user_id, code, serialize_user_overrides):
        user = SyUsuario.objects.filter(id_usuario=user_id).first()
        if not user:
            raise RbacWriteError(
                code="USER_NOT_FOUND",
                message="Usuario no encontrado",
                status_code=status.HTTP_404_NOT_FOUND,
                resource_id=user_id,
            )

        before = serialize_user_overrides(user)
        removed_override = False
        override = (
            RelUsuarioOverride.objects.select_related("id_permiso")
            .filter(id_usuario=user, id_permiso__codigo=code, fch_baja__isnull=True)
            .first()
        )

        if override:
            actor_permissions = set(UserRepository.build_auth_user(actor).get("permissions", []))
            RbacWritePolicy.validate_user_override_scope(
                actor=actor,
                target_user=user,
                permission=override.id_permiso,
                actor_permissions=actor_permissions,
            )

            override.fch_baja = timezone.now()
            override.usr_baja = actor
            override.save(update_fields=["fch_baja", "usr_baja"])
            removed_override = True

        if removed_override:
            touch_user_auth_revision(user, actor_id=actor.id_usuario)

        payload = {
            "userId": user.id_usuario,
            "overrides": serialize_user_overrides(user),
        }
        return {
            "target_user": user,
            "before": before,
            "payload": payload,
        }
