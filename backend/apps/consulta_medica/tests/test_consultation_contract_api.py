from django.contrib.auth.hashers import make_password
from rest_framework import status
from rest_framework.test import APITestCase

from apps.administracion.models import RelRolPermiso, RelUsuarioRol
from apps.authentication.models import DetUsuario, SyUsuario
from apps.catalogos.models import Permisos, Roles
from apps.consulta_medica.models import VisitConsultation
from apps.recepcion.models import Visit


class ConsultationContractsApiTests(APITestCase):
    def setUp(self):
        self.request_id = "33333333-3333-3333-3333-333333333333"
        self.doctor_password = "Doctor_123456"
        self.recepcion_password = "Recep_123456"

        self.doctor_user = self._create_user_with_role(
            username="doctor_user",
            email="doctor@example.com",
            password=self.doctor_password,
            role_code="DOCTOR",
            landing_route="/consultas",
        )
        self._create_user_with_role(
            username="recepcion_user",
            email="recepcion@example.com",
            password=self.recepcion_password,
            role_code="RECEPCION",
            landing_route="/recepcion",
        )
        self._create_user_with_role(
            username="clinico_user",
            email="clinico@example.com",
            password="Clinico_123456",
            role_code="CLINICO",
            landing_route="/clinico/consultas/doctor",
            permissions=["clinico:consultas:read"],
        )

        self.visit_ready = Visit.objects.create(
            folio="CNS-7001",
            patient_id=7001,
            arrival_type=Visit.ArrivalType.APPOINTMENT,
            appointment_id="APP-7001",
            status="lista_para_doctor",
        )
        self.visit_in_consultation = Visit.objects.create(
            folio="CNS-7002",
            patient_id=7002,
            arrival_type=Visit.ArrivalType.APPOINTMENT,
            appointment_id="APP-7002",
            status="en_consulta",
        )

    def _create_user_with_role(
        self,
        username,
        email,
        password,
        role_code,
        landing_route,
        permissions=None,
    ):
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
        role, _ = Roles.objects.get_or_create(
            rol=role_code,
            defaults={
                "desc_rol": f"Rol {role_code}",
                "landing_route": landing_route,
            },
        )
        RelUsuarioRol.objects.create(
            id_usuario=user,
            id_rol=role,
            is_primary=True,
        )

        for permission_code in permissions or []:
            permission, _ = Permisos.objects.get_or_create(
                codigo=permission_code,
                defaults={
                    "descripcion": permission_code,
                    "is_active": True,
                },
            )
            RelRolPermiso.objects.get_or_create(
                id_rol=role,
                id_permiso=permission,
            )

        return user

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

    def _csrf_headers(self):
        csrf_token = "csrf-token-test"
        self.client.cookies["csrf_token"] = csrf_token
        return {"HTTP_X_CSRF_TOKEN": csrf_token}

    def test_start_consultation_happy_path_contract(self):
        self._login_as("doctor_user", self.doctor_password)

        response = self.client.post(
            f"/api/v1/visits/{self.visit_ready.id_visit}/consultation/start",
            {},
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
            **self._csrf_headers(),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.visit_ready.id_visit)
        self.assertEqual(response.data["status"], "en_consulta")

    def test_start_consultation_role_not_allowed(self):
        self._login_as("recepcion_user", self.recepcion_password)

        response = self.client.post(
            f"/api/v1/visits/{self.visit_ready.id_visit}/consultation/start",
            {},
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
            **self._csrf_headers(),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "ROLE_NOT_ALLOWED")
        self.assertEqual(response.data["status"], 403)
        self.assertEqual(response.data["requestId"], self.request_id)

    def test_start_consultation_allows_clinico_with_consultas_permission(self):
        self._login_as("clinico_user", "Clinico_123456")

        response = self.client.post(
            f"/api/v1/visits/{self.visit_ready.id_visit}/consultation/start",
            {},
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
            **self._csrf_headers(),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "en_consulta")

    def test_close_consultation_happy_path_contract(self):
        self._login_as("doctor_user", self.doctor_password)

        response = self.client.post(
            f"/api/v1/visits/{self.visit_in_consultation.id_visit}/consultation/close",
            {
                "primaryDiagnosis": "Gastroenteritis aguda",
                "finalNote": "Reposo, hidratacion y seguimiento en 48h.",
            },
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
            **self._csrf_headers(),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("visit", response.data)
        self.assertIn("consultation", response.data)
        self.assertEqual(response.data["visit"]["status"], "cerrada")
        self.assertEqual(response.data["consultation"]["visitId"], self.visit_in_consultation.id_visit)

        consultation = VisitConsultation.objects.get(id_visit=self.visit_in_consultation)
        self.assertEqual(consultation.doctor_id, self.doctor_user.id_usuario)

    def test_close_consultation_allows_clinico_with_consultas_permission(self):
        self._login_as("clinico_user", "Clinico_123456")

        response = self.client.post(
            f"/api/v1/visits/{self.visit_in_consultation.id_visit}/consultation/close",
            {
                "primaryDiagnosis": "Infeccion de vias respiratorias",
                "finalNote": "Alta con recomendaciones generales.",
            },
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
            **self._csrf_headers(),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["visit"]["status"], "cerrada")

    def test_close_consultation_invalid_payload_returns_validation_error(self):
        self._login_as("doctor_user", self.doctor_password)

        response = self.client.post(
            f"/api/v1/visits/{self.visit_in_consultation.id_visit}/consultation/close",
            {"primaryDiagnosis": "", "finalNote": ""},
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
            **self._csrf_headers(),
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertEqual(response.data["code"], "VALIDATION_ERROR")
        self.assertEqual(response.data["status"], 422)
        self.assertEqual(response.data["requestId"], self.request_id)
        self.assertIn("details", response.data)

    def test_close_consultation_invalid_state_returns_visit_state_invalid(self):
        self._login_as("doctor_user", self.doctor_password)

        response = self.client.post(
            f"/api/v1/visits/{self.visit_ready.id_visit}/consultation/close",
            {
                "primaryDiagnosis": "Dx",
                "finalNote": "Nota",
            },
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
            **self._csrf_headers(),
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["code"], "VISIT_STATE_INVALID")
        self.assertEqual(response.data["status"], 409)
        self.assertEqual(response.data["requestId"], self.request_id)
