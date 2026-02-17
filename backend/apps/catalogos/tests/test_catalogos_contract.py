from django.contrib.auth.hashers import make_password
from django.db import connection
from rest_framework import status
from rest_framework.test import APITestCase

from apps.administracion.models import RelUsuarioRol
from apps.authentication.models import DetUsuario, SyUsuario
from apps.authentication.services.token_service import CSRF_COOKIE
from apps.catalogos.models import Areas, CatCentroAtencion, CatPermiso, CatRol


class CatalogosContractTests(APITestCase):
    def setUp(self):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS cat_areas (
                    id_area INTEGER PRIMARY KEY AUTOINCREMENT,
                    area VARCHAR(150) NOT NULL,
                    id_tparea BIGINT NOT NULL,
                    est_activo BOOLEAN NOT NULL DEFAULT 1,
                    fch_alta DATETIME,
                    fch_modf DATETIME,
                    fch_baja DATETIME,
                    usr_alta BIGINT,
                    usr_modf BIGINT,
                    usr_baja BIGINT
                )
                """
            )

        self.user = SyUsuario.objects.create(
            usuario="admincatalog",
            correo="admin.catalog@example.com",
            clave_hash=make_password("Admin_123456"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=self.user,
            nombre="Admin",
            paterno="Catalog",
            materno="",
            nombre_completo="Admin Catalog",
        )

        role = CatRol.objects.create(
            rol="ADMIN_CATALOG",
            desc_rol="Administrador de catalogos",
            landing_route="/admin/catalogos",
            is_admin=True,
            is_active=True,
        )
        RelUsuarioRol.objects.create(
            id_usuario=self.user,
            id_rol=role,
            is_primary=True,
        )

        CatPermiso.objects.create(
            codigo="admin:catalogos:centros_atencion:read",
            descripcion="Leer centros",
            is_active=True,
        )
        CatPermiso.objects.create(
            codigo="admin:catalogos:areas:read",
            descripcion="Leer areas",
            is_active=True,
        )

        self.center = CatCentroAtencion.objects.create(
            name="Centro Contract",
            code="CC-001",
            is_external=False,
            address="Av. Siempre Viva 123",
            schedule={"mon": "08:00-16:00"},
            is_active=True,
            created_by_id=self.user.id_usuario,
        )
        self.area = Areas.objects.create(
            name="Urgencias",
            code=10,
            is_active=True,
            created_by_id=self.user.id_usuario,
        )

        login_response = self.client.post(
            "/api/v1/auth/login",
            {"username": "admincatalog", "password": "Admin_123456"},
            format="json",
        )
        assert login_response.status_code == status.HTTP_200_OK
        self.client.cookies = login_response.cookies
        self.csrf_token = login_response.cookies.get(CSRF_COOKIE).value

    def test_care_centers_list_contract(self):
        response = self.client.get("/api/v1/care-centers")

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
        self.assertIn("code", item)
        self.assertIn("isExternal", item)
        self.assertIn("isActive", item)

    def test_care_centers_detail_contract(self):
        response = self.client.get(f"/api/v1/care-centers/{self.center.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("careCenter", response.data)
        center = response.data["careCenter"]
        self.assertEqual(center["id"], self.center.id)
        self.assertEqual(center["name"], "Centro Contract")
        self.assertIn("address", center)
        self.assertIn("schedule", center)
        self.assertIn("createdAt", center)
        self.assertIn("updatedAt", center)

    def test_create_care_center_contract(self):
        response = self.client.post(
            "/api/v1/care-centers",
            {
                "name": "Centro Norte",
                "code": "CC-002",
                "isExternal": True,
                "address": "Calle Norte 55",
                "schedule": {"fri": "09:00-14:00"},
                "isActive": True,
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data)
        self.assertEqual(response.data["name"], "Centro Norte")

    def test_update_care_center_contract(self):
        response = self.client.put(
            f"/api/v1/care-centers/{self.center.id}",
            {
                "name": "Centro Contract Actualizado",
                "code": "CC-001",
                "isExternal": False,
                "address": "Av. Actualizada 555",
                "schedule": {"mon": "07:00-15:00"},
                "isActive": True,
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("careCenter", response.data)
        self.assertEqual(
            response.data["careCenter"]["name"],
            "Centro Contract Actualizado",
        )

    def test_delete_care_center_contract(self):
        response = self.client.delete(
            f"/api/v1/care-centers/{self.center.id}",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"success": True})

    def test_care_centers_invalid_sort_by_returns_contract_error(self):
        response = self.client.get(
            "/api/v1/care-centers?sortBy=invalidField",
            HTTP_X_REQUEST_ID="req-catalog-123",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "VALIDATION_ERROR")
        self.assertEqual(response.data["requestId"], "req-catalog-123")
        self.assertIn("details", response.data)

    def test_areas_list_contract(self):
        response = self.client.get("/api/v1/areas")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("items", response.data)
        self.assertGreaterEqual(len(response.data["items"]), 1)

        item = response.data["items"][0]
        self.assertIn("id", item)
        self.assertIn("name", item)
        self.assertIn("code", item)
        self.assertIn("isActive", item)

    def test_areas_detail_contract(self):
        response = self.client.get(f"/api/v1/areas/{self.area.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("area", response.data)
        area = response.data["area"]
        self.assertEqual(area["id"], self.area.id)
        self.assertEqual(area["name"], "Urgencias")
        self.assertEqual(area["code"], 10)
        self.assertIn("createdAt", area)
        self.assertIn("updatedAt", area)

    def test_create_area_contract(self):
        response = self.client.post(
            "/api/v1/areas",
            {
                "name": "Farmacia",
                "code": 20,
                "isActive": True,
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data)
        self.assertEqual(response.data["name"], "Farmacia")

    def test_areas_duplicate_name_returns_409(self):
        response = self.client.post(
            "/api/v1/areas",
            {
                "name": "Urgencias",
                "code": 30,
                "isActive": True,
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["code"], "AREAS_EXISTS")
