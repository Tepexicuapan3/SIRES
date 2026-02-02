from django.contrib.auth.hashers import check_password, make_password
from django.db import models, transaction
from django.utils import timezone

from apps.administracion.models import RelRolPermiso, RelUsuarioOverride, RelUsuarioRol
from apps.authentication.models import SyUsuario
from apps.catalogos.models import CatPermiso, CatRol


class UserRepository:
    #Acceso a datos para autenticacion

    @staticmethod
    def get_by_username(usuario):
        return (
            SyUsuario.objects.select_related("detalle")
            .filter(usuario=usuario)
            .first()
        )

    @staticmethod
    def get_by_email(correo):
        return (
            SyUsuario.objects.select_related("detalle")
            .filter(correo=correo)
            .first()
        )

    @staticmethod
    def get_by_id(user_id):
        return (
            SyUsuario.objects.select_related("detalle")
            .filter(id_usuario=user_id)
            .first()
        )

    @staticmethod
    def verify_password(user, raw_password):
        # Valida el hash de la clave.
        return check_password(raw_password, user.clave_hash)

    @staticmethod
    def update_password(user, raw_password):
        # Actualiza la clave usando hash seguro.
        user.clave_hash = make_password(raw_password)
        user.fch_modf = timezone.now()
        user.usr_modf = user
        user.save(update_fields=["clave_hash", "fch_modf", "usr_modf"])

    @staticmethod
    def mark_onboarding_completed(user):
        # Marca que el onboarding fue completado.
        user.cambiar_clave = False
        user.terminos_acept = True
        user.fch_terminos = timezone.now()
        user.fch_modf = timezone.now()
        user.usr_modf = user
        user.save(
            update_fields=["cambiar_clave", "terminos_acept", "fch_terminos", "fch_modf", "usr_modf"]
        )

    @staticmethod
    def mark_password_reset(user):
        # Marca el reset de password sin modificar terminos.
        user.cambiar_clave = False
        user.fch_modf = timezone.now()
        user.usr_modf = user
        user.save(update_fields=["cambiar_clave", "fch_modf", "usr_modf"])

    @staticmethod
    def reset_failed_attempts(user):
        # Reinicia estado de bloqueo.
        if user.est_bloqueado:
            user.est_bloqueado = False
            user.fch_modf = timezone.now()
            user.usr_modf = user
            user.save(update_fields=["est_bloqueado", "fch_modf", "usr_modf"])

    @staticmethod
    @transaction.atomic
    def mark_last_access(user, ip_address):
        # Registra ultimo acceso e IP.
        user.last_conexion = timezone.now()
        user.ip_ultima = ip_address
        user.fch_modf = timezone.now()
        user.usr_modf = user
        user.save(update_fields=["last_conexion", "ip_ultima", "fch_modf", "usr_modf"])

    @staticmethod
    def build_auth_user(user):
        # Mapea modelo a contrato AuthUser.
        profile = getattr(user, "detalle", None)
        roles, primary_role, landing_route, is_admin = _get_roles(user)
        permissions = _get_permissions(user, roles, is_admin)

        full_name = ""
        if profile and profile.nombre_completo:
            full_name = profile.nombre_completo
        else:
            full_name = " ".join(
                [
                    part
                    for part in [
                        profile.nombre if profile else "",
                        profile.paterno if profile else "",
                        profile.materno if profile else "",
                    ]
                    if part
                ]
            ).strip()

        return {
            "id": user.id_usuario,
            "username": user.usuario,
            "fullName": full_name,
            "email": user.correo,
            "primaryRole": primary_role,
            "landingRoute": landing_route,
            "roles": roles,
            "permissions": permissions,
            "mustChangePassword": user.cambiar_clave,
            "requiresOnboarding": user.cambiar_clave or not user.terminos_acept,
        }


def _get_roles(user):
    active_roles = (
        RelUsuarioRol.objects.select_related("id_rol")
        .filter(id_usuario=user, fch_baja__isnull=True, id_rol__est_activo=True)
        .order_by("id_usuario_rol")
    )

    roles = []
    primary_role = None
    landing_route = None
    is_admin = False

    for rel in active_roles:
        role = rel.id_rol
        roles.append(role.rol)
        if rel.is_primary and not primary_role:
            primary_role = role.rol
            landing_route = role.landing_route
        if role.is_admin:
            is_admin = True

    if not primary_role and roles:
        primary_role = roles[0]
        role = CatRol.objects.filter(rol=primary_role, est_activo=True).first()
        landing_route = role.landing_route if role else None

    if not primary_role:
        primary_role = ""

    return roles, primary_role, landing_route, is_admin


def _get_permissions(user, roles, is_admin):
    if is_admin:
        return ["*"]

    role_ids = list(
        CatRol.objects.filter(rol__in=roles, est_activo=True).values_list("id_rol", flat=True)
    )
    permissions = set()

    if role_ids:
        role_perm_ids = (
            RelRolPermiso.objects.filter(id_rol_id__in=role_ids, fch_baja__isnull=True)
            .values_list("id_permiso_id", flat=True)
        )
        for code in CatPermiso.objects.filter(
            id_permiso__in=role_perm_ids, est_activo=True
        ).values_list("codigo", flat=True):
            permissions.add(code)

    now = timezone.now()
    overrides = RelUsuarioOverride.objects.filter(
        id_usuario=user,
        fch_baja__isnull=True,
    ).filter(models.Q(fch_expira__isnull=True) | models.Q(fch_expira__gt=now))

    for override in overrides:
        perm = CatPermiso.objects.filter(
            id_permiso=override.id_permiso_id, est_activo=True
        ).first()
        if not perm:
            continue
        if override.efecto == "DENY" and perm.codigo in permissions:
            permissions.discard(perm.codigo)
        elif override.efecto == "ALLOW":
            permissions.add(perm.codigo)

    return sorted(list(permissions))
