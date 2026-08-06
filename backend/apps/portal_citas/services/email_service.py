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

El HTML sí se comparte: ``templates/portal_citas/otp_email.html`` extiende
``authentication/base_transactional_email.html`` (mismo layout/caja de
código de 6 dígitos que el correo de recuperación de contraseña), para que
el correo del portal se vea igual que el resto de las notificaciones de
SISEM.
"""

import logging

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

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

    company_name = getattr(settings, "EMAIL_COMPANY_NAME", "SISEM STC Metro")
    # Los logos del header del correo se sirven desde el propio dominio de
    # SISEM (frontend/public/assets/..., publicado en CITAS_BASE_URL una vez
    # deployado) en vez de depender de un host externo tipo ibb.co -- los 2
    # links de ibb.co que usa el resto de los correos de SISEM están ROTOS
    # (HTTP 404, verificado 2026-08-05), así que no vale la pena repetir ese
    # patrón acá. Los archivos ya están copiados a
    # frontend/public/assets/brand/logos/{email,secondary}/ -- mientras
    # CITAS_BASE_URL no apunte a un dominio real y deployado, estas URLs no
    # van a resolver (el header del correo va a mostrar el ícono roto del
    # cliente de correo hasta entonces, eso es esperado en dev).
    citas_base_url = getattr(settings, "CITAS_BASE_URL", "").rstrip("/")
    # Primer logo del header (slot "logo_url" del template): los dos logos
    # "unidos" (SISEM + Citas en Línea, conectados).
    logo_url = getattr(
        settings,
        "EMAIL_PORTAL_CITAS_LOGO_URL",
        f"{citas_base_url}/assets/brand/logos/email/logos-unidos-sisem-portal.png",
    )
    # Segundo logo del header (slot "metro_logo_url" del template, nombre
    # heredado del template compartido): SOLO el logo secundario del portal
    # (el medallón), sin el de SISEM.
    metro_logo_url = getattr(
        settings,
        "EMAIL_PORTAL_CITAS_SECONDARY_LOGO_URL",
        f"{citas_base_url}/assets/brand/logos/secondary/logo_portal_citas.png",
    )
    support_email = getattr(
        settings, "SISEM_SUPPORT_EMAIL", settings.DEFAULT_FROM_EMAIL or "soporte@sisem.local"
    )
    html_message = render_to_string(
        "portal_citas/otp_email.html",
        {
            "user_name": safe_name,
            "verification_code": code,
            "company_name": company_name,
            "current_year": timezone.now().year,
            "expiration_minutes": OTP_TTL_MINUTES,
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
