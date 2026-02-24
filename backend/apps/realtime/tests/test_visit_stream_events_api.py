import asyncio

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth.hashers import make_password
from rest_framework import status
from rest_framework.test import APITestCase

from apps.administracion.models import RelRolPermiso, RelUsuarioRol
from apps.authentication.models import DetUsuario, SyUsuario
from apps.catalogos.models import Permisos, Roles
from apps.recepcion.models import Visit
from apps.realtime.consumers.visits import VISITS_STREAM_GROUP
from apps.realtime.publisher import REALTIME_EVENT_HANDLER
from apps.realtime.schemas import ENVELOPE_VERSION


class VisitStreamRealtimeEventsApiTests(APITestCase):
    def setUp(self):
        self.request_id = "44444444-4444-4444-4444-444444444444"
        self.recepcion_password = "Recep_123456"
        self.clinico_password = "Clinico_123456"
        self.doctor_password = "Doctor_123456"

        self._create_user_with_role(
            username="recepcion_ws",
            email="recepcion_ws@example.com",
            password=self.recepcion_password,
            role_code="RECEPCION",
            landing_route="/recepcion/fichas/medicina-general",
        )
        self._create_user_with_role(
            username="clinico_ws",
            email="clinico_ws@example.com",
            password=self.clinico_password,
            role_code="CLINICO",
            landing_route="/clinico/somatometria",
            permissions=["clinico:somatometria:read"],
        )
        self._create_user_with_role(
            username="doctor_ws",
            email="doctor_ws@example.com",
            password=self.doctor_password,
            role_code="DOCTOR",
            landing_route="/clinico/consultas/doctor",
        )

        self.visit_recepcion = Visit.objects.create(
            folio="WS-RCP-0001",
            patient_id=91001,
            arrival_type=Visit.ArrivalType.APPOINTMENT,
            appointment_id="APP-WS-0001",
            status="en_espera",
        )
        self.visit_somatometria = Visit.objects.create(
            folio="WS-SMT-0001",
            patient_id=92001,
            arrival_type=Visit.ArrivalType.WALK_IN,
            status="en_somatometria",
        )
        self.visit_doctor_ready = Visit.objects.create(
            folio="WS-DOC-0001",
            patient_id=93001,
            arrival_type=Visit.ArrivalType.APPOINTMENT,
            appointment_id="APP-WS-0002",
            status="lista_para_doctor",
        )
        self.visit_doctor_open = Visit.objects.create(
            folio="WS-DOC-0002",
            patient_id=93002,
            arrival_type=Visit.ArrivalType.APPOINTMENT,
            appointment_id="APP-WS-0003",
            status="en_consulta",
        )

    def _create_user_with_role(
        self,
        *,
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

    def _subscribe_visits_stream(self):
        channel_layer = get_channel_layer()
        channel_name = async_to_sync(channel_layer.new_channel)()
        async_to_sync(channel_layer.group_add)(VISITS_STREAM_GROUP, channel_name)
        return channel_layer, channel_name

    def _read_group_message(self, channel_layer, channel_name, timeout=1):
        async def _receive():
            return await asyncio.wait_for(channel_layer.receive(channel_name), timeout=timeout)

        return async_to_sync(_receive)()

    def _unsubscribe_visits_stream(self, channel_layer, channel_name):
        async_to_sync(channel_layer.group_discard)(VISITS_STREAM_GROUP, channel_name)

    def _assert_event_envelope(self, event, *, expected_event_type, expected_entity_id):
        self.assertEqual(event.get("eventType"), expected_event_type)
        self.assertEqual(event.get("entity"), "visit")
        self.assertEqual(event.get("entityId"), str(expected_entity_id))
        self.assertEqual(event.get("version"), ENVELOPE_VERSION)
        self.assertEqual(event.get("requestId"), self.request_id)
        self.assertEqual(event.get("correlationId"), self.request_id)
        self.assertIsInstance(event.get("sequence"), int)
        self.assertGreater(event.get("sequence"), 0)

    def test_create_visit_publishes_status_changed_event(self):
        self._login_as("recepcion_ws", self.recepcion_password)
        channel_layer, channel_name = self._subscribe_visits_stream()

        response = self.client.post(
            "/api/v1/visits",
            {
                "patientId": 91555,
                "arrivalType": "appointment",
                "appointmentId": "APP-WS-CREATE",
                "doctorId": 77,
                "notes": "visita creada para prueba realtime",
            },
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
            **self._csrf_headers(),
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        message = self._read_group_message(channel_layer, channel_name)
        self._unsubscribe_visits_stream(channel_layer, channel_name)

        self.assertEqual(message.get("type"), REALTIME_EVENT_HANDLER)
        event = message.get("event") or {}
        self._assert_event_envelope(
            event,
            expected_event_type="visit.status.changed",
            expected_entity_id=response.data["id"],
        )
        self.assertEqual(event.get("payload", {}).get("status"), "en_espera")

    def test_patch_visit_status_publishes_status_changed_event(self):
        self._login_as("recepcion_ws", self.recepcion_password)
        channel_layer, channel_name = self._subscribe_visits_stream()

        response = self.client.patch(
            f"/api/v1/visits/{self.visit_recepcion.id_visit}/status",
            {"targetStatus": "cancelada"},
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
            **self._csrf_headers(),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        message = self._read_group_message(channel_layer, channel_name)
        self._unsubscribe_visits_stream(channel_layer, channel_name)

        self.assertEqual(message.get("type"), REALTIME_EVENT_HANDLER)
        event = message.get("event") or {}
        self._assert_event_envelope(
            event,
            expected_event_type="visit.status.changed",
            expected_entity_id=self.visit_recepcion.id_visit,
        )
        self.assertEqual(event.get("payload", {}).get("status"), "cancelada")

    def test_capture_vitals_publishes_status_changed_event(self):
        self._login_as("clinico_ws", self.clinico_password)
        channel_layer, channel_name = self._subscribe_visits_stream()

        response = self.client.post(
            f"/api/v1/visits/{self.visit_somatometria.id_visit}/vitals",
            {
                "weightKg": 72,
                "heightCm": 175,
                "temperatureC": 36.6,
                "oxygenSaturationPct": 98,
            },
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        message = self._read_group_message(channel_layer, channel_name)
        self._unsubscribe_visits_stream(channel_layer, channel_name)

        self.assertEqual(message.get("type"), REALTIME_EVENT_HANDLER)
        event = message.get("event") or {}
        self._assert_event_envelope(
            event,
            expected_event_type="visit.status.changed",
            expected_entity_id=self.visit_somatometria.id_visit,
        )
        self.assertEqual(event.get("payload", {}).get("status"), "lista_para_doctor")

    def test_start_consultation_publishes_status_changed_event(self):
        self._login_as("doctor_ws", self.doctor_password)
        channel_layer, channel_name = self._subscribe_visits_stream()

        response = self.client.post(
            f"/api/v1/visits/{self.visit_doctor_ready.id_visit}/consultation/start",
            {},
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
            **self._csrf_headers(),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        message = self._read_group_message(channel_layer, channel_name)
        self._unsubscribe_visits_stream(channel_layer, channel_name)

        self.assertEqual(message.get("type"), REALTIME_EVENT_HANDLER)
        event = message.get("event") or {}
        self._assert_event_envelope(
            event,
            expected_event_type="visit.status.changed",
            expected_entity_id=self.visit_doctor_ready.id_visit,
        )
        self.assertEqual(event.get("payload", {}).get("status"), "en_consulta")

    def test_close_consultation_publishes_visit_closed_event(self):
        self._login_as("doctor_ws", self.doctor_password)
        channel_layer, channel_name = self._subscribe_visits_stream()

        response = self.client.post(
            f"/api/v1/visits/{self.visit_doctor_open.id_visit}/consultation/close",
            {
                "primaryDiagnosis": "Rinofaringitis",
                "finalNote": "Alta con manejo ambulatorio.",
            },
            format="json",
            HTTP_X_REQUEST_ID=self.request_id,
            **self._csrf_headers(),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        message = self._read_group_message(channel_layer, channel_name)
        self._unsubscribe_visits_stream(channel_layer, channel_name)

        self.assertEqual(message.get("type"), REALTIME_EVENT_HANDLER)
        event = message.get("event") or {}
        self._assert_event_envelope(
            event,
            expected_event_type="visit.closed",
            expected_entity_id=self.visit_doctor_open.id_visit,
        )
        self.assertEqual(event.get("payload"), {})
