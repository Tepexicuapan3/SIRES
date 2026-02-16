from django.contrib.auth.hashers import make_password
from rest_framework import status
from rest_framework.test import APITestCase

from apps.administracion.models import RelUsuarioRol
from apps.authentication.models import DetUsuario, SyUsuario
from apps.catalogos.models import CatRol


class VisitContractsApiTests(APITestCase):
    def setUp(self):
        self.request_id = "11111111-1111-1111-1111-111111111111"
        self.recepcion_password = "Recep_123456"
        self.medico_password = "Medico_123456"

        self._create_user_with_role(
            username="recepcion_user",
            email="recepcion@example.com",
            password=self.recepcion_password,
            role_code="RECEPCION",
        )
        self._create_user_with_role(
            username="medico_user",
            email="medico@example.com",
            password=self.medico_password,
            role_code="MEDICO",
        )

    def _create_user_with_role(self, username, email, password, role_code):
        user = SyUsuario.objects.create(
            usuario=username,
            correo=email,
            clave_hash=make_password(password),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=user,
            nombre=username,
            paterno="Test",
            materno="User",
            nombre_completo=f"{username} Test User",
        )
        role = CatRol.objects.create(
            rol=role_code,
            desc_rol=f"Rol {role_code}",
            landing_route="/recepcion" if role_code == "RECEPCION" else "/consultas",
        )
        RelUsuarioRol.objects.create(
            id_usuario=user,
            id_rol=role,
            is_primary=True,
        )

    def _login_as(self, username, password):
        self.client.cookies.clear()
        response = self.client.post(
            "/api/v1/auth/login",
            {"username": username, "password": password},
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.cookies = response.cookies

    def _create_visit(self, patient_id=1001, has_appointment=True):
        response = self.client.post(
            "/api/v1/visits",
            {
                "patientId": patient_id,
                "hasAppointment": has_appointment,
            },
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return response.data

    def test_create_visit_happy_path_contract(self):
        self._login_as("recepcion_user", self.recepcion_password)

        response = self.client.post(
            "/api/v1/visits",
            {
                "patientId": 1234,
                "hasAppointment": True,
            },
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data)
        self.assertEqual(response.data["patientId"], 1234)
        self.assertTrue(response.data["hasAppointment"])
        self.assertEqual(response.data["status"], "en_espera")

    def test_create_visit_invalid_payload_returns_validation_error(self):
        self._login_as("recepcion_user", self.recepcion_password)

        response = self.client.post(
            "/api/v1/visits",
            {"hasAppointment": True},
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertEqual(response.data["code"], "VALIDATION_ERROR")
        self.assertEqual(response.data["status"], 422)
        self.assertEqual(response.data["requestId"], self.request_id)
        self.assertIn("details", response.data)
        self.assertIn("patientId", response.data["details"])

    def test_create_visit_role_not_allowed(self):
        self._login_as("medico_user", self.medico_password)

        response = self.client.post(
            "/api/v1/visits",
            {
                "patientId": 1234,
                "hasAppointment": True,
            },
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "ROLE_NOT_ALLOWED")
        self.assertEqual(response.data["status"], 403)
        self.assertEqual(response.data["requestId"], self.request_id)

    def test_list_visits_happy_path_contract(self):
        self._login_as("recepcion_user", self.recepcion_password)
        self._create_visit(patient_id=2001)
        self._create_visit(patient_id=2002, has_appointment=False)

        response = self.client.get(
            "/api/v1/visits?page=1&pageSize=20",
            HTTP_X_REQUEST_ID=self.request_id,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("items", response.data)
        self.assertIn("page", response.data)
        self.assertIn("pageSize", response.data)
        self.assertIn("total", response.data)
        self.assertIn("totalPages", response.data)
        self.assertGreaterEqual(len(response.data["items"]), 2)

        first_item = response.data["items"][0]
        self.assertIn("id", first_item)
        self.assertIn("patientId", first_item)
        self.assertIn("hasAppointment", first_item)
        self.assertIn("status", first_item)

    def test_list_visits_role_not_allowed(self):
        self._login_as("medico_user", self.medico_password)

        response = self.client.get(
            "/api/v1/visits",
            HTTP_X_REQUEST_ID=self.request_id,
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "ROLE_NOT_ALLOWED")
        self.assertEqual(response.data["status"], 403)
        self.assertEqual(response.data["requestId"], self.request_id)

    def test_patch_visit_status_cancelada_happy_path(self):
        self._login_as("recepcion_user", self.recepcion_password)
        visit = self._create_visit(patient_id=3001)

        response = self.client.patch(
            f"/api/v1/visits/{visit['id']}/status",
            {"status": "cancelada"},
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], visit["id"])
        self.assertEqual(response.data["status"], "cancelada")

    def test_patch_visit_status_no_show_happy_path(self):
        self._login_as("recepcion_user", self.recepcion_password)
        visit = self._create_visit(patient_id=3002)

        response = self.client.patch(
            f"/api/v1/visits/{visit['id']}/status",
            {"status": "no_show"},
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], visit["id"])
        self.assertEqual(response.data["status"], "no_show")

    def test_patch_visit_status_invalid_payload_returns_validation_error(self):
        self._login_as("recepcion_user", self.recepcion_password)
        visit = self._create_visit(patient_id=3003)

        response = self.client.patch(
            f"/api/v1/visits/{visit['id']}/status",
            {"status": "en_consulta"},
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertEqual(response.data["code"], "VALIDATION_ERROR")
        self.assertEqual(response.data["status"], 422)
        self.assertEqual(response.data["requestId"], self.request_id)
        self.assertIn("details", response.data)
        self.assertIn("status", response.data["details"])

    def test_patch_visit_status_role_not_allowed(self):
        self._login_as("recepcion_user", self.recepcion_password)
        visit = self._create_visit(patient_id=3004)

        self._login_as("medico_user", self.medico_password)
        response = self.client.patch(
            f"/api/v1/visits/{visit['id']}/status",
            {"status": "cancelada"},
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "ROLE_NOT_ALLOWED")
        self.assertEqual(response.data["status"], 403)
        self.assertEqual(response.data["requestId"], self.request_id)

    def test_patch_visit_status_invalid_transition_returns_visit_state_invalid(self):
        self._login_as("recepcion_user", self.recepcion_password)
        visit = self._create_visit(patient_id=3005)

        first_patch = self.client.patch(
            f"/api/v1/visits/{visit['id']}/status",
            {"status": "cancelada"},
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
        )
        self.assertEqual(first_patch.status_code, status.HTTP_200_OK)

        second_patch = self.client.patch(
            f"/api/v1/visits/{visit['id']}/status",
            {"status": "no_show"},
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
        )

        self.assertEqual(second_patch.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(second_patch.data["code"], "VISIT_STATE_INVALID")
        self.assertEqual(second_patch.data["status"], 409)
        self.assertEqual(second_patch.data["requestId"], self.request_id)

    def test_patch_visit_status_visit_not_found(self):
        self._login_as("recepcion_user", self.recepcion_password)

        response = self.client.patch(
            "/api/v1/visits/999999/status",
            {"status": "cancelada"},
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "VISIT_NOT_FOUND")
        self.assertEqual(response.data["status"], 404)
        self.assertEqual(response.data["requestId"], self.request_id)
