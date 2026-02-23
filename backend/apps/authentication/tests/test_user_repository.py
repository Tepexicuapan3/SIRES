from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.test import TestCase
from django.utils import timezone

from apps.administracion.models import RelRolPermiso, RelUsuarioOverride, RelUsuarioRol
from apps.authentication.models import DetUsuario, SyUsuario
from apps.authentication.repositories.user_repository import UserRepository
from apps.catalogos.models import CatPermiso, CatRol


class UserRepositoryTests(TestCase):
    def setUp(self):
        self.user = SyUsuario.objects.create(
            usuario="repo_user",
            correo="repo.user@example.com",
            clave_hash=make_password("Repo_123456"),
            est_activo=True,
            cambiar_clave=True,
            terminos_acept=False,
        )
        self.detail = DetUsuario.objects.create(
            id_usuario=self.user,
            nombre="Repo",
            paterno="User",
            materno="",
            nombre_completo="Repo User",
        )
        self.role = CatRol.objects.create(
            rol="REPO_ROLE",
            desc_rol="Role repo",
            landing_route="/repo",
            is_active=True,
        )
        RelUsuarioRol.objects.create(
            id_usuario=self.user,
            id_rol=self.role,
            is_primary=True,
        )
        self.permission = CatPermiso.objects.create(
            codigo="repo:read",
            descripcion="Repo read",
            is_active=True,
        )
        RelRolPermiso.objects.create(id_rol=self.role, id_permiso=self.permission)

    def test_reset_failed_attempts_unblocks_user(self):
        self.user.est_bloqueado = True
        self.user.save(update_fields=["est_bloqueado"])

        UserRepository.reset_failed_attempts(self.user)

        self.user.refresh_from_db()
        self.assertFalse(self.user.est_bloqueado)

    def test_build_auth_user_uses_name_parts_when_full_name_missing(self):
        self.detail.nombre_completo = ""
        self.detail.nombre = "Repo"
        self.detail.paterno = "Fallback"
        self.detail.materno = "Name"
        self.detail.save()

        payload = UserRepository.build_auth_user(self.user)

        self.assertEqual(payload["fullName"], "Repo Fallback Name")

    def test_build_auth_user_primary_fallback_when_no_primary_flag(self):
        RelUsuarioRol.objects.filter(id_usuario=self.user).update(is_primary=False)

        payload = UserRepository.build_auth_user(self.user)

        self.assertEqual(payload["primaryRole"], "REPO_ROLE")
        self.assertEqual(payload["landingRoute"], "/repo")

    def test_build_auth_user_skips_inactive_override_permission(self):
        inactive_permission = CatPermiso.objects.create(
            codigo="repo:inactive",
            descripcion="Repo inactive",
            is_active=False,
        )
        RelUsuarioOverride.objects.create(
            id_usuario=self.user,
            id_permiso=inactive_permission,
            efecto="ALLOW",
            fch_expira=timezone.now() + timedelta(days=1),
        )

        payload = UserRepository.build_auth_user(self.user)

        self.assertNotIn("repo:inactive", payload["permissions"])

    def test_det_usuario_str(self):
        self.assertEqual(str(self.detail), "Repo User")
