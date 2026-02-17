from django.contrib.auth.hashers import make_password
from rest_framework import status
from rest_framework.test import APITestCase

from apps.administracion.models import RelRolPermiso, RelUsuarioRol
from apps.authentication.models import DetUsuario, SyUsuario
from apps.authentication.services.token_service import CSRF_COOKIE
from apps.catalogos.models import CatCentroAtencion, CatPermiso, CatRol


class CatalogosAuthzTests(APITestCase):
    def setUp(self):
        self.role = CatRol.objects.create(
            rol="CATALOG_READER",
            desc_rol="Rol de catalogos",
            landing_route="/catalogos",
            is_active=True,
        )

        self.perm_read = CatPermiso.objects.create(
            codigo="admin:catalogos:centros_atencion:read",
            descripcion="Leer centros",
            is_active=True,
        )
        self.perm_create = CatPermiso.objects.create(
            codigo="admin:catalogos:centros_atencion:create",
            descripcion="Crear centros",
            is_active=True,
        )

        self.user = SyUsuario.objects.create(
            usuario="catalog_user",
            correo="catalog.user@example.com",
            clave_hash=make_password("Catalog_123456"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=self.user,
            nombre="Catalog",
            paterno="User",
            materno="",
            nombre_completo="Catalog User",
        )
        RelUsuarioRol.objects.create(id_usuario=self.user, id_rol=self.role, is_primary=True)

        self.center = CatCentroAtencion.objects.create(
            name="Centro Authz",
            code="CA-001",
            is_external=False,
            address="Direccion 1",
            schedule={"mon": "08:00-16:00"},
            is_active=True,
            created_by_id=self.user.id_usuario,
        )

    def _login(self):
        response = self.client.post(
            "/api/v1/auth/login",
            {"username": "catalog_user", "password": "Catalog_123456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.cookies = response.cookies
        return response

    def test_list_requires_authentication(self):
        response = self.client.get("/api/v1/care-centers")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "TOKEN_INVALID")

    def test_list_requires_permission(self):
        self._login()

        response = self.client.get("/api/v1/care-centers")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "PERMISSION_DENIED")

    def test_list_with_permission_succeeds(self):
        RelRolPermiso.objects.create(id_rol=self.role, id_permiso=self.perm_read)
        self._login()

        response = self.client.get("/api/v1/care-centers")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("items", response.data)
        self.assertGreaterEqual(len(response.data["items"]), 1)

    def test_create_requires_csrf(self):
        RelRolPermiso.objects.create(id_rol=self.role, id_permiso=self.perm_create)
        self._login()

        response = self.client.post(
            "/api/v1/care-centers",
            {
                "name": "Centro Nuevo",
                "code": "CA-002",
                "isExternal": True,
                "address": "Direccion 2",
                "schedule": {"fri": "09:00-14:00"},
                "isActive": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "PERMISSION_DENIED")

    def test_create_with_permission_and_csrf_succeeds(self):
        RelRolPermiso.objects.create(id_rol=self.role, id_permiso=self.perm_create)
        login_response = self._login()
        csrf_token = login_response.cookies.get(CSRF_COOKIE).value

        response = self.client.post(
            "/api/v1/care-centers",
            {
                "name": "Centro Nuevo",
                "code": "CA-002",
                "isExternal": True,
                "address": "Direccion 2",
                "schedule": {"fri": "09:00-14:00"},
                "isActive": True,
            },
            format="json",
            HTTP_X_CSRF_TOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data)
        self.assertEqual(response.data["name"], "Centro Nuevo")
