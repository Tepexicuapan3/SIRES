from django.db.models import Q

from apps.administracion.models import RelRolPermiso, RelUsuarioRol
from apps.catalogos.models import Permisos, Roles


class RbacReadRepository:
    SORT_MAP = {
        "name": "rol",
        "description": "desc_rol",
        "isActive": "is_active",
        "isSystem": "es_sistema",
    }

    def list_roles(
        self,
        *,
        page,
        page_size,
        search=None,
        is_active=None,
        is_system=None,
        sort_by="name",
        sort_order="asc",
    ):
        queryset = Roles.objects.all()

        if search:
            queryset = queryset.filter(
                Q(rol__icontains=search) | Q(desc_rol__icontains=search)
            )
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        if is_system is not None:
            queryset = queryset.filter(es_sistema=is_system)

        order_field = self.SORT_MAP[sort_by]
        if sort_order == "desc":
            order_field = f"-{order_field}"
        queryset = queryset.order_by(order_field)

        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        roles = list(queryset[start:end])

        return {
            "roles": roles,
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
        }

    def get_role(self, role_id):
        return Roles.objects.filter(id_rol=role_id).first()

    def list_role_permissions(self, role):
        return list(
            RelRolPermiso.objects.select_related("id_permiso", "usr_asignacion")
            .filter(id_rol=role, fch_baja__isnull=True, id_permiso__is_active=True)
            .order_by("id_permiso__codigo")
        )

    def count_role_permissions(self, role):
        return RelRolPermiso.objects.filter(
            id_rol=role,
            fch_baja__isnull=True,
            id_permiso__is_active=True,
        ).count()

    def count_role_users(self, role):
        return RelUsuarioRol.objects.filter(
            id_rol=role,
            fch_baja__isnull=True,
            id_usuario__est_activo=True,
        ).count()

    def list_permissions(self):
        return list(Permisos.objects.filter(is_active=True).order_by("codigo"))
