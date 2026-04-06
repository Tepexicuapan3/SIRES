from apps.administracion.models import RelUsuarioRol
from apps.catalogos.models import Roles


class RbacRoleMutationRepository:
    def get_role(self, role_id):
        return Roles.objects.filter(id_rol=role_id).first()

    def role_exists_by_name(self, name, *, exclude_role_id=None):
        queryset = Roles.objects.filter(rol=name)
        if exclude_role_id is not None:
            queryset = queryset.exclude(id_rol=exclude_role_id)
        return queryset.exists()

    def create_role(self, *, name, description, landing_route, actor_id):
        return Roles.objects.create(
            rol=name,
            desc_rol=description,
            landing_route=landing_route,
            is_active=True,
            created_by_id=actor_id,
        )

    def has_active_users(self, role):
        return RelUsuarioRol.objects.filter(
            id_rol=role,
            fch_baja__isnull=True,
            id_usuario__est_activo=True,
        ).exists()

    def active_user_ids_for_role(self, role):
        return list(
            RelUsuarioRol.objects.filter(id_rol=role, fch_baja__isnull=True)
            .values_list("id_usuario_id", flat=True)
            .distinct()
        )
