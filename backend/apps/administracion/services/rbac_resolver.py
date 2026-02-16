from django.utils import timezone
from ..models import RelUsuarioRol, RelRolPermiso, RelUsuarioOverride


class RBACResolver:

    @staticmethod
    def get_effective_permissions(usuario):

        roles = (
            RelUsuarioRol.objects
            .filter(id_usuario=usuario, fch_baja__isnull=True)
            .select_related("id_rol")
        )

        if any(r.id_rol.is_admin for r in roles):
            return ["*"]

        permisos = set()

        for rel in roles:
            permisos_rol = RelRolPermiso.objects.filter(
                id_rol=rel.id_rol,
                fch_baja__isnull=True,
                id_permiso__est_activo=True
            )

            permisos.update(p.id_permiso.codigo for p in permisos_rol)

        overrides = RelUsuarioOverride.objects.filter(
            id_usuario=usuario,
            fch_baja__isnull=True,
        )

        now = timezone.now()

        for ov in overrides:
            if ov.fch_expira and ov.fch_expira < now:
                continue

            code = ov.id_permiso.codigo

            if ov.efecto == "DENY":
                permisos.discard(code)
            else:
                permisos.add(code)

        return sorted(permisos)
