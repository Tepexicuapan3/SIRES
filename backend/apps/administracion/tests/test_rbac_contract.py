from django.contrib.auth.hashers import make_password
from rest_framework import status
from rest_framework.test import APITestCase

from apps.administracion.models import RelRolPermiso, RelUsuarioRol
from apps.authentication.models import DetUsuario, SyUsuario
from apps.authentication.services.token_service import CSRF_COOKIE
from apps.catalogos.models import CatPermiso, CatRol


class RbacContractTests(APITestCase):
    def setUp(self):
        self.user = SyUsuario.objects.create(
            usuario="adminrbac",
            correo="admin.rbac@example.com",
            clave_hash=make_password("Admin_123456"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=self.user,
            nombre="Admin",
            paterno="RBAC",
            materno="",
            nombre_completo="Admin RBAC",
        )

        self.role = CatRol.objects.create(
            rol="ADMIN_RBAC",
            desc_rol="Administrador de pruebas",
            landing_route="/admin/roles",
            is_admin=True,
            is_active=True,
        )
        RelUsuarioRol.objects.create(
            id_usuario=self.user,
            id_rol=self.role,
            is_primary=True,
        )

        self.permission = CatPermiso.objects.create(
            codigo="admin:gestion:permisos:read",
            descripcion="Leer permisos",
            is_active=True,
        )
        RelRolPermiso.objects.create(id_rol=self.role, id_permiso=self.permission)

        login_response = self.client.post(
            "/api/v1/auth/login",
            {"username": "adminrbac", "password": "Admin_123456"},
            format="json",
        )
        assert login_response.status_code == status.HTTP_200_OK
        self.client.cookies = login_response.cookies
        self.csrf_token = login_response.cookies.get(CSRF_COOKIE).value

    def test_roles_list_contract(self):
        response = self.client.get("/api/v1/roles")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("items", response.data)
        self.assertIn("page", response.data)
        self.assertIn("pageSize", response.data)
        self.assertIn("total", response.data)
        self.assertIn("totalPages", response.data)
        self.assertGreaterEqual(len(response.data["items"]), 1)

        item = response.data["items"][0]
        self.assertIn("id", item)
        self.assertIn("name", item)
        self.assertIn("description", item)
        self.assertIn("isActive", item)
        self.assertIn("isSystem", item)
        self.assertIn("landingRoute", item)
        self.assertIn("permissionsCount", item)
        self.assertIn("usersCount", item)

    def test_create_role_contract(self):
        response = self.client.post(
            "/api/v1/roles",
            {
                "name": "SUPERVISOR_RBAC",
                "description": "Rol de supervisor",
                "landingRoute": "/admin/supervisor",
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data)
        self.assertEqual(response.data["name"], "SUPERVISOR_RBAC")

    def test_permissions_catalog_contract(self):
        response = self.client.get("/api/v1/permissions")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("items", response.data)
        self.assertIn("total", response.data)
        self.assertGreaterEqual(response.data["total"], 1)
        self.assertGreaterEqual(len(response.data["items"]), 1)

        item = response.data["items"][0]
        self.assertIn("id", item)
        self.assertIn("code", item)
        self.assertIn("description", item)
        self.assertIn("isSystem", item)

    def test_users_list_contract(self):
        response = self.client.get("/api/v1/users")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("items", response.data)
        self.assertGreaterEqual(len(response.data["items"]), 1)

        user_item = response.data["items"][0]
        self.assertIn("id", user_item)
        self.assertIn("username", user_item)
        self.assertIn("fullname", user_item)
        self.assertIn("email", user_item)
        self.assertIn("clinic", user_item)
        self.assertIn("primaryRole", user_item)
        self.assertIn("isActive", user_item)
