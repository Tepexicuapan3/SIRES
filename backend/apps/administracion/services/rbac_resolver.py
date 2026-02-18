from django.utils import timezone
from ..models import RelUsuarioRol, RelRolPermiso, RelUsuarioOverride
from apps.catalogos.models import CatPermiso


class RBACResolver:

    @staticmethod
    def get_effective_permissions(usuario):

        roles = (
            RelUsuarioRol.objects
            .filter(id_usuario=usuario, fch_baja__isnull=True)
            .select_related("id_rol")
        )

        is_admin = any(r.id_rol.is_admin for r in roles)

        permisos = set()

        if is_admin:
            permisos.update(
                CatPermiso.objects.filter(is_active=True).values_list("codigo", flat=True)
            )
        else:
            for rel in roles:
                permisos_rol = RelRolPermiso.objects.filter(
                    id_rol=rel.id_rol,
                    fch_baja__isnull=True,
                    id_permiso__is_active=True
                )

                permisos.update(p.id_permiso.codigo for p in permisos_rol)

        overrides = RelUsuarioOverride.objects.filter(
            id_usuario=usuario,
            fch_baja__isnull=True,
            id_permiso__is_active=True,
        ).select_related("id_permiso")

        now = timezone.now()

        has_active_deny = any(
            ov.efecto == "DENY" and (not ov.fch_expira or ov.fch_expira > now)
            for ov in overrides
        )
        if is_admin and not has_active_deny:
            return ["*"]

        for ov in overrides:
            if ov.fch_expira and ov.fch_expira <= now:
                continue

            code = ov.id_permiso.codigo

            if ov.efecto == "DENY":
                permisos.discard(code)
            else:
                permisos.add(code)

        return sorted(permisos)
