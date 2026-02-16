from django.test import TestCase
from rest_framework.test import APIRequestFactory

from apps.administracion.models import AuditoriaEvento
from apps.authentication.models import SyUsuario
from apps.authentication.services.audit_service import log_event


class AuditServiceTests(TestCase):
    def test_log_event_creates_row(self):
        factory = APIRequestFactory()
        request = factory.get("/api/v1/auth/me", HTTP_X_REQUEST_ID="req-123")

        user = SyUsuario.objects.create(
            usuario="audit",
            correo="audit@example.com",
            clave_hash="hash",
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )

        log_event(
            request,
            "SESSION_VALIDATE",
            "SUCCESS",
            actor_user=user,
            target_user=user,
            meta={"endpoint": "/auth/me"},
        )

        self.assertEqual(
            AuditoriaEvento.objects.filter(accion="SESSION_VALIDATE").count(), 1
        )
