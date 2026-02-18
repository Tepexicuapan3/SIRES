import logging

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

from apps.authentication.services.otp_service import OTP_TTL_SECONDS

logger = logging.getLogger(__name__)


def send_reset_code_email(recipient_email, code, user_name=None):
    # Envía el código OTP por correo.
    if not _smtp_is_configured():
        logger.warning("SMTP no configurado para enviar OTP")
        return True

    subject = "Código de recuperación"
    safe_name = user_name or recipient_email
    expiration_minutes = max(1, int(OTP_TTL_SECONDS / 60))
    support_email = getattr(
        settings,
        "SIRES_SUPPORT_EMAIL",
        settings.DEFAULT_FROM_EMAIL or "soporte@sires.local",
    )
    message = (
        f"Hola {safe_name}, recibimos una solicitud para restablecer la contraseña de tu cuenta.\n\n"
        "Tu código de verificación es: "
        f"{code}\n"
        f"Válido por {expiration_minutes} minutos.\n\n"
        "Si no solicitaste este código, puedes ignorar este correo con tranquilidad.\n"
        f"Soporte: {support_email}"
    )
    company_name = getattr(settings, "EMAIL_COMPANY_NAME", "SIRES STC Metro")
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
            "support_email": support_email,
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


def send_user_credentials_email(recipient_email, username, temporary_password, user_name=None):
    if not _smtp_is_configured():
        logger.error("SMTP no configurado para enviar credenciales de usuario")
        return False

    safe_name = user_name or username or recipient_email
    subject = "Credenciales de acceso a SIRES"
    login_url = getattr(settings, "SIRES_LOGIN_URL", "http://localhost:5173/login")
    support_email = getattr(
        settings,
        "SIRES_SUPPORT_EMAIL",
        settings.DEFAULT_FROM_EMAIL or "soporte@sires.local",
    )
    company_name = getattr(settings, "EMAIL_COMPANY_NAME", "SIRES STC Metro")
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

    message = (
        f"Hola {safe_name}, tu cuenta de SIRES fue creada.\n\n"
        f"Usuario: {username}\n"
        f"Contraseña temporal: {temporary_password}\n\n"
        "Pasos para acceder:\n"
        f"1. Ingresa a {login_url}\n"
        "2. Inicia sesión con las credenciales temporales.\n"
        "3. Cambia tu contraseña en el primer acceso.\n\n"
        "Recomendaciones de seguridad:\n"
        "- No compartas estas credenciales.\n"
        "- Usa una contraseña única al cambiarla.\n"
        "- Si no reconoces esta alta, repórtala de inmediato.\n"
        f"- Soporte: {support_email}\n"
    )
    html_message = render_to_string(
        "authentication/new_user_credentials_email.html",
        {
            "user_name": safe_name,
            "username": username,
            "temporary_password": temporary_password,
            "login_url": login_url,
            "support_email": support_email,
            "company_name": company_name,
            "current_year": timezone.now().year,
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
        logger.exception("Fallo al enviar correo de credenciales")
        return False

    return True


def _smtp_is_configured():
    return bool(
        settings.EMAIL_HOST
        and settings.EMAIL_HOST_USER
        and settings.EMAIL_HOST_PASSWORD
    )
