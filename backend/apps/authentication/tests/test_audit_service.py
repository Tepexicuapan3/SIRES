from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIRequestFactory

from apps.administracion.models import AuditoriaEvento
from apps.authentication.models import SyUsuario
from apps.authentication.services.audit_service import (log_event, mask_email,
                                                        mask_username)


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

    def test_log_event_does_not_raise_when_audit_insert_fails(self):
        factory = APIRequestFactory()
        request = factory.get("/api/v1/auth/me", HTTP_X_REQUEST_ID="req-456")

        with patch(
            "apps.authentication.services.audit_service.AuditoriaEvento.objects.create"
        ) as create_mock:
            create_mock.side_effect = RuntimeError("db down")
            log_event(request, "SESSION_VALIDATE", "SUCCESS")

        self.assertEqual(
            AuditoriaEvento.objects.filter(request_id="req-456").count(),
            0,
        )

    def test_mask_helpers(self):
        self.assertEqual(mask_email("user@example.com"), "u***@example.com")
        self.assertEqual(mask_email("invalid"), "***")
        self.assertEqual(mask_username("usuario"), "u***")
        self.assertEqual(mask_username(""), "***")
