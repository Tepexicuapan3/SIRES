from apps.administracion.models import RelRolPermiso, RelUsuarioRol
from apps.authentication.models import DetUsuario, SyUsuario
from apps.catalogos.models import Permisos, Roles
from django.contrib.auth.hashers import make_password


def build_auth_user_fixture(
    *,
    username: str = "abelb",
    email: str = "abel@example.com",
    password: str = "Abel_180903",
    role_name: str = "MEDICO",
    landing_route: str = "/expedientes",
    permission_code: str = "expedientes:read",
    requires_onboarding: bool = True,
):
    user = SyUsuario.objects.create(
        usuario=username,
        correo=email,
        clave_hash=make_password(password),
        est_activo=True,
        cambiar_clave=requires_onboarding,
        terminos_acept=not requires_onboarding,
    )

    DetUsuario.objects.create(
        id_usuario=user,
        nombre="Abel",
        paterno="Buendia",
        materno="Velazco",
        nombre_completo="Abel Buendia Velazco",
    )

    role = Roles.objects.create(
        rol=role_name,
        desc_rol="Rol de pruebas auth",
        landing_route=landing_route,
    )

    permission = Permisos.objects.create(
        codigo=permission_code,
        descripcion="Permiso de pruebas auth",
    )

    RelUsuarioRol.objects.create(id_usuario=user, id_rol=role, is_primary=True)
    RelRolPermiso.objects.create(id_rol=role, id_permiso=permission)

    return {
        "user": user,
        "role": role,
        "permission": permission,
        "password": password,
    }
