from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIRequestFactory

from apps.administracion.models import AuditoriaEvento
from apps.authentication.models import SyUsuario
from apps.authentication.services.audit_service import (
    log_event,
    mask_email,
    mask_username,
)


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

    def test_log_event_existing_callers_keep_recurso_tipo_auth(self):
        """
        D1 (change `somatometria-modulo-integral`): un caller que NO pasa
        ninguno de los kwargs nuevos (`resource_type`, `resource_id`,
        `datos_antes`, `datos_despues`, `raise_on_error`) debe seguir
        viendo el comportamiento EXACTO de antes -- `recurso_tipo="auth"`,
        sin `recurso_id`/`datos_antes`/`datos_despues`.
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1/auth/me", HTTP_X_REQUEST_ID="req-existing-caller")

        log_event(request, "SESSION_VALIDATE", "SUCCESS")

        event = AuditoriaEvento.objects.get(request_id="req-existing-caller")
        self.assertEqual(event.recurso_tipo, "auth")
        self.assertIsNone(event.recurso_id)
        self.assertIsNone(event.datos_antes)
        self.assertIsNone(event.datos_despues)

    def test_log_event_existing_callers_stay_silent_on_failure(self):
        """
        D1: sin `raise_on_error` (default `False`, igual que antes), una
        falla de auditoria sigue sin propagar excepcion -- los 73 callers
        existentes no deben empezar a explotar.
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1/auth/me", HTTP_X_REQUEST_ID="req-silent-fail")

        with patch(
            "apps.authentication.services.audit_service.AuditoriaEvento.objects.create"
        ) as create_mock:
            create_mock.side_effect = RuntimeError("db down")
            try:
                log_event(request, "SESSION_VALIDATE", "SUCCESS")
            except Exception:  # noqa: BLE001
                self.fail(
                    "log_event sin raise_on_error no debe propagar la excepcion "
                    "(regresion D1)."
                )

    def test_log_event_raise_on_error_true_propagates_exception(self):
        """
        D1: `raise_on_error=True` (auditoria estricta, ej. edicion de
        somatometria) SI debe propagar la excepcion, para que el
        `transaction.atomic()` del caller revierta la operacion completa.
        """
        factory = APIRequestFactory()
        request = factory.get("/api/v1/auth/me", HTTP_X_REQUEST_ID="req-raise")

        with patch(
            "apps.authentication.services.audit_service.AuditoriaEvento.objects.create"
        ) as create_mock:
            create_mock.side_effect = RuntimeError("db down")
            with self.assertRaises(RuntimeError):
                log_event(
                    request,
                    "VitalsEdited",
                    "SUCCESS",
                    resource_type="vitals",
                    raise_on_error=True,
                )

    def test_log_event_new_kwargs_persist_resource_and_diff(self):
        """
        D1: con los kwargs nuevos, el evento persiste `recurso_tipo`
        distinto de "auth", `recurso_id`, `datos_antes` y `datos_despues`.
        """
        factory = APIRequestFactory()
        request = factory.patch(
            "/api/v1/visits/1/vitals", HTTP_X_REQUEST_ID="req-vitals-edit"
        )

        log_event(
            request,
            "VitalsEdited",
            "SUCCESS",
            resource_type="vitals",
            resource_id=42,
            datos_antes={"weightKg": 70.0},
            datos_despues={"weightKg": 72.0},
        )

        event = AuditoriaEvento.objects.get(request_id="req-vitals-edit")
        self.assertEqual(event.recurso_tipo, "vitals")
        self.assertEqual(event.recurso_id, 42)
        self.assertEqual(event.datos_antes, {"weightKg": 70.0})
        self.assertEqual(event.datos_despues, {"weightKg": 72.0})

    def test_log_event_keeps_policy_metadata(self):
        factory = APIRequestFactory()
        request = factory.post(
            "/api/v1/auth/login",
            HTTP_X_REQUEST_ID="req-policy-metadata",
            HTTP_USER_AGENT="pytest",
            REMOTE_ADDR="127.0.0.1",
        )

        log_event(
            request,
            "POLICY_ENFORCEMENT_DENY",
            "FAIL",
            error_code="ACCOUNT_LOCKED",
            meta={
                "policyKey": "login.account.lock",
                "threshold": 5,
                "window": "15m",
                "counterValue": 5,
                "lockTtl": 900,
            },
        )

        event = AuditoriaEvento.objects.get(accion="POLICY_ENFORCEMENT_DENY")
        self.assertEqual(event.request_id, "req-policy-metadata")
        self.assertEqual(event.meta.get("policyKey"), "login.account.lock")
        self.assertEqual(event.meta.get("threshold"), 5)
        self.assertEqual(event.meta.get("window"), "15m")
