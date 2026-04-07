from django.db import IntegrityError
from rest_framework import status

from apps.administracion.models import RelUsuarioOverride
from apps.authentication.models import SyUsuario
from apps.authentication.repositories.user_repository import UserRepository
from apps.authentication.services.auth_revision import touch_user_auth_revision
from apps.catalogos.models import Permisos

from ...policies.rbac_write_policy import RbacWritePolicy
from .exceptions import RbacWriteError


class UpsertUserOverrideUseCase:
    @staticmethod
    def execute(
        *,
        actor,
        user_id,
        permission_code,
        effect,
        expires_at_raw,
        parse_expires_at,
        serialize_user_overrides,
    ):
        user = SyUsuario.objects.select_for_update().filter(id_usuario=user_id).first()
        if not user:
            raise RbacWriteError(
                code="USER_NOT_FOUND",
                message="Usuario no encontrado",
                status_code=status.HTTP_404_NOT_FOUND,
                resource_id=user_id,
            )

        if not permission_code or effect not in {"ALLOW", "DENY"}:
            raise RbacWriteError(
                code="VALIDATION_ERROR",
                message="Datos de entrada invalidos",
                status_code=status.HTTP_400_BAD_REQUEST,
                details={
                    "permissionCode": ["Campo requerido"] if not permission_code else [],
                    "effect": ["Debe ser ALLOW o DENY"]
                    if effect not in {"ALLOW", "DENY"}
                    else [],
                },
                resource_id=user.id_usuario,
                target_user=user,
            )

        permission = Permisos.objects.filter(codigo=permission_code, is_active=True).first()
        if not permission:
            raise RbacWriteError(
                code="PERMISSION_NOT_FOUND",
                message="Permiso no encontrado",
                status_code=status.HTTP_404_NOT_FOUND,
                resource_id=user.id_usuario,
                target_user=user,
            )

        actor_permissions = set(UserRepository.build_auth_user(actor).get("permissions", []))
        RbacWritePolicy.validate_user_override_scope(
            actor=actor,
            target_user=user,
            permission=permission,
            actor_permissions=actor_permissions,
        )

        expires_at = None
        if expires_at_raw:
            expires_at = parse_expires_at(expires_at_raw)
            if expires_at == "invalid":
                raise RbacWriteError(
                    code="INVALID_FORMAT",
                    message="Formato invalido",
                    status_code=status.HTTP_400_BAD_REQUEST,
                    details={"expiresAt": ["Debe ser una fecha ISO 8601 valida"]},
                    resource_id=user.id_usuario,
                    target_user=user,
                )

        before = serialize_user_overrides(user)
        has_override_changes = False

        override = RelUsuarioOverride.objects.select_for_update().filter(
            id_usuario=user,
            id_permiso=permission,
        ).first()

        def _apply_override_state(current_override):
            nonlocal has_override_changes
            has_override_changes = (
                current_override.efecto != effect
                or current_override.fch_expira != expires_at
                or current_override.fch_baja is not None
                or current_override.usr_baja_id is not None
            )
            current_override.efecto = effect
            current_override.fch_expira = expires_at
            current_override.fch_baja = None
            current_override.usr_baja = None
            if not current_override.usr_asignacion_id:
                current_override.usr_asignacion = actor
            current_override.save()

        if override:
            _apply_override_state(override)
        else:
            try:
                RelUsuarioOverride.objects.create(
                    id_usuario=user,
                    id_permiso=permission,
                    efecto=effect,
                    fch_expira=expires_at,
                    usr_asignacion=actor,
                )
                has_override_changes = True
            except IntegrityError:
                override = RelUsuarioOverride.objects.select_for_update().filter(
                    id_usuario=user,
                    id_permiso=permission,
                ).first()
                if not override:
                    raise
                _apply_override_state(override)

        if has_override_changes:
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
