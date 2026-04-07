from django.db import IntegrityError

from apps.administracion.models import RelUsuarioRol
from apps.authentication.models import SyUsuario
from apps.authentication.services.auth_revision import touch_user_auth_revision
from apps.catalogos.models import Roles

from .exceptions import RbacWriteError


class AssignUserRolesUseCase:
    @staticmethod
    def execute(*, actor, user_id, role_ids, serialize_user_roles):
        user = SyUsuario.objects.select_for_update().filter(id_usuario=user_id).first()
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

        role_ids = list(dict.fromkeys(role_ids))

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
        existing_relations = {
            relation.id_rol_id: relation
            for relation in RelUsuarioRol.objects.select_for_update().filter(
                id_usuario=user
            )
        }

        for role_id in role_ids:
            relation = existing_relations.get(role_id)
            if not relation:
                try:
                    relation = RelUsuarioRol.objects.create(
                        id_usuario=user,
                        id_rol=roles[role_id],
                        is_primary=False,
                        usr_asignacion=actor,
                    )
                    existing_relations[role_id] = relation
                    has_role_changes = True
                except IntegrityError:
                    relation = RelUsuarioRol.objects.select_for_update().filter(
                        id_usuario=user,
                        id_rol_id=role_id,
                    ).first()
                    if not relation:
                        raise
                    existing_relations[role_id] = relation

            if relation.fch_baja is not None:
                relation.fch_baja = None
                relation.usr_baja = None
                relation.save(update_fields=["fch_baja", "usr_baja"])
                has_role_changes = True

        active_relations = list(
            RelUsuarioRol.objects.select_for_update()
            .filter(
                id_usuario=user,
                fch_baja__isnull=True,
            )
            .order_by("id_usuario_rol")
        )
        has_primary = any(relation.is_primary for relation in active_relations)
        if not has_primary and active_relations:
            first_relation = active_relations[0]
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
