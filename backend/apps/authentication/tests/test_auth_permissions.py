from django.contrib.auth.hashers import make_password
from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.test import TestCase
from django.utils import timezone

from apps.administracion.models import RelRolPermiso, RelUsuarioOverride, RelUsuarioRol
from apps.authentication.models import DetUsuario, SyUsuario
from apps.authentication.repositories.user_repository import UserRepository
from apps.catalogos.models import CatPermiso, CatRol


class AuthPermissionsTests(TestCase):
    def setUp(self):
        self.user = SyUsuario.objects.create(
            usuario="admin",
            correo="admin@example.com",
            clave_hash=make_password("Clave_123456"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=self.user,
            nombre="Admin",
            paterno="User",
            materno="",
            nombre_completo="Admin User",
        )

    def test_permissions_admin(self):
        role = CatRol.objects.create(
            rol="ADMIN",
            desc_rol="Administrador",
            landing_route="/admin",
            is_admin=True,
        )
        RelUsuarioRol.objects.create(id_usuario=self.user, id_rol=role, is_primary=True)

        auth_user = UserRepository.build_auth_user(self.user)

        self.assertEqual(auth_user["permissions"], ["*"])
        self.assertEqual(auth_user["roles"], ["ADMIN"])
        self.assertEqual(auth_user["primaryRole"], "ADMIN")

    def test_permissions_overrides(self):
        role = CatRol.objects.create(
            rol="MEDICO",
            desc_rol="Medico",
            landing_route="/expedientes",
        )
        RelUsuarioRol.objects.create(id_usuario=self.user, id_rol=role, is_primary=True)

        perm_read = CatPermiso.objects.create(
            codigo="expedientes:read",
            descripcion="Leer",
        )
        perm_write = CatPermiso.objects.create(
            codigo="expedientes:write",
            descripcion="Escribir",
        )
        perm_extra = CatPermiso.objects.create(
            codigo="pacientes:read",
            descripcion="Leer pacientes",
        )
        RelRolPermiso.objects.create(id_rol=role, id_permiso=perm_read)
        RelRolPermiso.objects.create(id_rol=role, id_permiso=perm_write)

        RelUsuarioOverride.objects.create(
            id_usuario=self.user,
            id_permiso=perm_write,
            efecto="DENY",
        )
        RelUsuarioOverride.objects.create(
            id_usuario=self.user,
            id_permiso=perm_extra,
            efecto="ALLOW",
        )

        auth_user = UserRepository.build_auth_user(self.user)

        self.assertIn("expedientes:read", auth_user["permissions"])
        self.assertIn("pacientes:read", auth_user["permissions"])
        self.assertNotIn("expedientes:write", auth_user["permissions"])

    def test_permissions_override_expired(self):
        role = CatRol.objects.create(
            rol="MEDICO",
            desc_rol="Medico",
            landing_route="/expedientes",
        )
        RelUsuarioRol.objects.create(id_usuario=self.user, id_rol=role, is_primary=True)

        perm_read = CatPermiso.objects.create(
            codigo="expedientes:read",
            descripcion="Leer",
        )
        RelRolPermiso.objects.create(id_rol=role, id_permiso=perm_read)

        RelUsuarioOverride.objects.create(
            id_usuario=self.user,
            id_permiso=perm_read,
            efecto="DENY",
            fch_expira=timezone.now() - timedelta(days=1),
        )

        auth_user = UserRepository.build_auth_user(self.user)

        self.assertIn("expedientes:read", auth_user["permissions"])

    def test_no_roles_defaults(self):
        auth_user = UserRepository.build_auth_user(self.user)

        self.assertEqual(auth_user["roles"], [])
        self.assertEqual(auth_user["permissions"], [])
        self.assertEqual(auth_user["landingRoute"], None)

    def test_requires_onboarding_flag(self):
        self.user.cambiar_clave = True
        self.user.terminos_acept = False
        self.user.save(update_fields=["cambiar_clave", "terminos_acept"])

        auth_user = UserRepository.build_auth_user(self.user)

        self.assertTrue(auth_user["requiresOnboarding"])
