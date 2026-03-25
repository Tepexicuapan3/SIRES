from dataclasses import dataclass
from typing import List, Optional
from django.utils import timezone
from ..models import RelUsuarioRol, RelRolPermiso, RelUsuarioOverride
from apps.catalogos.models import Permisos, Roles


@dataclass
class UserRole:
    """Role data contract for cross-domain access."""

    rol: str
    landing_route: Optional[str]
    is_admin: bool
    is_primary: bool


class RBACResolver:
    @staticmethod
    def get_effective_permissions(usuario):

        roles = RelUsuarioRol.objects.filter(
            id_usuario=usuario, fch_baja__isnull=True
        ).select_related("id_rol")

        is_admin = any(r.id_rol.is_admin for r in roles)

        permisos = set()

        if is_admin:
            permisos.update(
                Permisos.objects.filter(is_active=True).values_list("codigo", flat=True)
            )
        else:
            for rel in roles:
                permisos_rol = RelRolPermiso.objects.filter(
                    id_rol=rel.id_rol, fch_baja__isnull=True, id_permiso__is_active=True
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

    @staticmethod
    def get_user_roles(usuario) -> List[UserRole]:
        """
        Get active roles for a user.
        Returns a list of UserRole contracts for cross-domain consumption.
        """
        active_roles = (
            RelUsuarioRol.objects.select_related("id_rol")
            .filter(id_usuario=usuario, fch_baja__isnull=True, id_rol__is_active=True)
            .order_by("id_usuario_rol")
        )

        roles = []
        primary_role = None
        landing_route = None
        is_admin = False

        for rel in active_roles:
            role = rel.id_rol
            roles.append(
                UserRole(
                    rol=role.rol,
                    landing_route=role.landing_route,
                    is_admin=role.is_admin,
                    is_primary=rel.is_primary,
                )
            )
            if rel.is_primary and not primary_role:
                primary_role = role.rol
                landing_route = role.landing_route
            if role.is_admin:
                is_admin = True

        # If no primary role assigned, get the first one
        if not primary_role and roles:
            primary_role = roles[0].rol
            landing_route = roles[0].landing_route

        # Return tuple: (roles_list, primary_role, landing_route, is_admin)
        return roles, primary_role, landing_route, is_admin

    @staticmethod
    def get_role_by_name(rol_name: str) -> Optional[Roles]:
        """Get role by name from catalogos."""
        return Roles.objects.filter(rol=rol_name, is_active=True).first()
