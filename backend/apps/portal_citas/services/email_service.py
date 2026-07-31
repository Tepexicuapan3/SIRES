"""
apps/portal_citas/services/email_service.py
==============================================
Envío del OTP de acceso al portal de Citas en Línea.

``apps.authentication.services.email_service.send_reset_code_email`` es
genérico (no depende de ``SyUsuario``) pero su copy es específica de
"recuperación de contraseña" — no aplica al login del portal. Esta función
es su equivalente chico para el portal: reusa la MISMA configuración de
``EMAIL_BACKEND`` / ``DEFAULT_FROM_EMAIL`` de ``settings.py`` (no duplica
nada de SMTP), solo cambia el armado del mensaje.
"""

import logging

from django.conf import settings
from django.core.mail import send_mail

from apps.portal_citas.services.otp_service import OTP_TTL_MINUTES

logger = logging.getLogger(__name__)


def send_otp_email(recipient_email: str, code: str, member_name: str | None = None) -> bool:
    if not _smtp_is_configured():
        logger.warning("SMTP no configurado para enviar OTP del portal de citas")
        return True

    safe_name = member_name or recipient_email
    subject = "Código de acceso — Citas en línea"
    message = (
        f"Hola {safe_name}, recibimos una solicitud de acceso al portal de "
        "Citas en Línea.\n\n"
        f"Tu código de verificación es: {code}\n"
        f"Válido por {OTP_TTL_MINUTES} minutos.\n\n"
        "Si no solicitaste este código, puedes ignorar este correo con "
        "tranquilidad."
    )

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [recipient_email],
            fail_silently=False,
        )
    except Exception:
        logger.exception("Fallo al enviar OTP del portal de citas")
        return False

    return True


def _smtp_is_configured() -> bool:
    if settings.EMAIL_BACKEND != "django.core.mail.backends.smtp.EmailBackend":
        return True

    return bool(
        settings.EMAIL_HOST
        and settings.EMAIL_HOST_USER
        and settings.EMAIL_HOST_PASSWORD
    )
