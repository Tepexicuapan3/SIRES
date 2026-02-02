import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_reset_code_email(recipient_email, code):
    # Envia el codigo OTP por correo.
    if not _smtp_is_configured():
        logger.warning("SMTP no configurado para enviar OTP")
        return False

    subject = "Codigo de recuperacion"
    message = (
        "Tu codigo de recuperacion es: "
        f"{code}\n\n"
        "Este codigo expira en 10 minutos."
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
        # No exponer fallas SMTP al usuario final.
        logger.exception("Fallo al enviar OTP")
        return False

    return True


def _smtp_is_configured():
    backend = getattr(settings, "EMAIL_BACKEND", "")
    if backend == "django.core.mail.backends.console.EmailBackend":
        return True

    return bool(
        settings.EMAIL_HOST
        and settings.EMAIL_HOST_USER
        and settings.EMAIL_HOST_PASSWORD
    )
