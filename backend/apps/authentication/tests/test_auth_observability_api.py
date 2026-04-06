from django.contrib.auth.hashers import make_password
from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.administracion.models import RelUsuarioRol
from apps.authentication.models import DetUsuario, SyUsuario
from apps.authentication.services.token_service import CSRF_COOKIE
from apps.catalogos.models import Roles


@override_settings(
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }
)
class AuthObservabilityApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = SyUsuario.objects.create(
            usuario="obs_admin",
            correo="obs.admin@example.com",
            clave_hash=make_password("ObsAdmin_123456"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=self.admin,
            nombre="Obs",
            paterno="Admin",
            materno="",
            nombre_completo="Obs Admin",
        )
        self.admin_role = Roles.objects.create(
            rol="AUTH_OBS_ADMIN",
            desc_rol="Admin observabilidad auth",
            landing_route="/admin/observability",
            is_admin=True,
            is_active=True,
        )
        RelUsuarioRol.objects.create(
            id_usuario=self.admin,
            id_rol=self.admin_role,
            is_primary=True,
        )

    def _login(self, password="ObsAdmin_123456"):
        response = self.client.post(
            "/api/v1/auth/login",
            {"username": "obs_admin", "password": password},
            format="json",
        )
        if response.status_code == status.HTTP_200_OK:
            self.client.cookies = response.cookies
            self.csrf_token = response.cookies.get(CSRF_COOKIE).value
        return response

    def test_observability_endpoint_requires_authentication(self):
        response = self.client.get("/api/v1/auth/ops/observability")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_observability_endpoint_exposes_login_metrics_snapshot(self):
        success_login = self._login()
        self.assertEqual(success_login.status_code, status.HTTP_200_OK)

        failed_login = self.client.post(
            "/api/v1/auth/login",
            {"username": "obs_admin", "password": "bad-password"},
            format="json",
        )
        self.assertEqual(failed_login.status_code, status.HTTP_401_UNAUTHORIZED)

        self._login()
        response = self.client.get("/api/v1/auth/ops/observability")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("generatedAt", response.data)
        self.assertIn("metrics", response.data)
        self.assertIn("alerts", response.data)

        metrics = response.data["metrics"]
        self.assertIn("authAccessLoginTotal", metrics)
        self.assertGreaterEqual(metrics["authAccessLoginTotal"]["success"], 1)
        self.assertGreaterEqual(metrics["authAccessLoginTotal"]["fail"], 1)
