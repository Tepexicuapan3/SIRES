import logging

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

from apps.authentication.services.otp_service import OTP_TTL_SECONDS

logger = logging.getLogger(__name__)


def send_reset_code_email(recipient_email, code, user_name=None):
    # Envia el codigo OTP por correo.
    if not _smtp_is_configured():
        logger.warning("SMTP no configurado para enviar OTP")
        return False

    subject = "Codigo de recuperacion"
    safe_name = user_name or recipient_email
    expiration_minutes = max(1, int(OTP_TTL_SECONDS / 60))
    message = (
        f"Hola {safe_name}, recibimos una solicitud para restablecer la contrasena de tu cuenta.\n\n"
        "Tu codigo de verificacion es: "
        f"{code}\n"
        f"Valido por {expiration_minutes} minutos.\n\n"
        "Si no solicitaste este codigo, puedes ignorar este correo de manera segura."
    )
    company_name = getattr(settings, "EMAIL_COMPANY_NAME", "Acme Corp")
    logo_url = getattr(
        settings,
        "EMAIL_LOGO_URL",
        "https://i.ibb.co/zhdkzrZp/SIRES.webp",
    )
    metro_logo_url = getattr(
        settings,
        "EMAIL_METRO_LOGO_URL",
        "https://i.ibb.co/zhdc3v4c/metro-logo-borde.jpg",
    )
    html_message = render_to_string(
        "authentication/reset_code_email.html",
        {
            "user_name": safe_name,
            "verification_code": code,
            "company_name": company_name,
            "current_year": timezone.now().year,
            "expiration_minutes": expiration_minutes,
            "logo_url": logo_url,
            "metro_logo_url": metro_logo_url,
        },
    )
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [recipient_email],
            fail_silently=False,
            html_message=html_message,
        )
    except Exception:
        # No exponer fallas SMTP al usuario final.
        logger.exception("Fallo al enviar OTP")
        return False

    return True


def _smtp_is_configured():
    return bool(
        settings.EMAIL_HOST
        and settings.EMAIL_HOST_USER
        and settings.EMAIL_HOST_PASSWORD
    )
