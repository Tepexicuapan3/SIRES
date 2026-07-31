"""
apps/portal_citas/services/notificacion_service.py
======================================================
Envío por correo del comprobante de cita reservada desde el portal
(Fase 5), con el PDF (folio + datos + QR) adjunto.

El correo SIEMPRE se manda a ``miembro_sesion`` (el adulto logueado que
gestionó la reserva), nunca al campo ``correo`` de ``miembro_objetivo`` --
ese miembro puede ser un hijo menor sin correo propio, o un
derechohabiente adulto distinto del que inició sesión.

Reusa la MISMA configuración SMTP (``EMAIL_BACKEND``/``DEFAULT_FROM_EMAIL``
de ``settings.py``) que ``services.email_service`` ya usa para el OTP de
login (Fase 2) -- no se reinventa nada de configuración de correo acá.
"""

import logging

from django.conf import settings
from django.core.mail import EmailMessage
from django.utils import timezone

from apps.portal_citas.services.pdf_comprobante_service import generar_pdf_comprobante
from apps.recepcion.models import CitaMedica, CitaNotificacion

logger = logging.getLogger(__name__)


def enviar_comprobante_portal(cita: CitaMedica, miembro_objetivo, miembro_sesion) -> CitaNotificacion:
    """
    Genera el PDF (con QR) del comprobante y lo envía por correo al adulto
    que gestionó la reserva (``miembro_sesion``). Registra el intento en
    ``CitaNotificacion`` con ``tipo="comprobante_portal"``.

    Si falla el envío (sin correo capturado, SMTP no configurado,
    excepción de red, etc.) la excepción NO se propaga -- se registra
    ``enviado=False`` y se loguea. Este servicio corre en una tarea de
    Celery en background, después de que la cita ya quedó confirmada; un
    fallo de correo nunca debe hacer que la reserva "falle" desde el
    punto de vista del paciente.
    """
    email_destino = miembro_sesion.correo

    notif = CitaNotificacion.objects.create(
        cita=cita,
        tipo="comprobante_portal",
        email_destino=email_destino,
    )

    if not email_destino:
        logger.warning(
            "No se pudo enviar comprobante portal para cita %s: "
            "miembro_sesion %s no tiene correo capturado.",
            cita.folio,
            miembro_sesion.id,
        )
        return notif

    try:
        pdf_bytes = generar_pdf_comprobante(cita, miembro_objetivo)

        subject = f"Comprobante de cita — {cita.folio}"
        body = (
            f"Hola {miembro_sesion.nombre_visible},\n\n"
            f"La cita para {miembro_objetivo.nombre_visible} se reservó con éxito.\n\n"
            f"Folio: {cita.folio}\n"
            f"Fecha: {cita.fecha_hora.strftime('%d/%m/%Y %H:%M')}\n\n"
            "Adjuntamos tu comprobante en PDF. Preséntalo (impreso o desde "
            "tu teléfono) el día de la cita para el check-in en recepción."
        )

        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email_destino],
        )
        email.attach(f"comprobante_{cita.folio}.pdf", pdf_bytes, "application/pdf")
        email.send(fail_silently=False)

        notif.enviado = True
        notif.enviado_at = timezone.now()
        notif.save(update_fields=["enviado", "enviado_at"])
    except Exception:
        logger.exception("Error enviando comprobante portal para cita %s", cita.folio)

    return notif


def enviar_cancelacion_portal(cita: CitaMedica, miembro_sesion) -> CitaNotificacion:
    """
    Envía por correo la confirmación de que una cita se canceló (Fase 6) al
    adulto que gestionó la cancelación (``miembro_sesion`` -- mismo criterio
    que ``enviar_comprobante_portal``: nunca se manda al ``correo`` del
    miembro objetivo, que puede ser un menor sin correo propio). Registra el
    intento en ``CitaNotificacion`` con ``tipo="cancelacion"``.

    Sin PDF adjunto (a diferencia del comprobante de reserva) -- solo
    confirma que la cita quedó cancelada, no hay nada que presentar en
    recepción.

    Igual que ``enviar_comprobante_portal``: si falla el envío, la
    excepción NO se propaga -- se registra ``enviado=False`` y se loguea.
    Corre en una tarea de Celery en background, después de que la
    cancelación ya se confirmó en la base de datos.
    """
    email_destino = miembro_sesion.correo

    notif = CitaNotificacion.objects.create(
        cita=cita,
        tipo="cancelacion",
        email_destino=email_destino,
    )

    if not email_destino:
        logger.warning(
            "No se pudo enviar el correo de cancelación portal para cita %s: "
            "miembro_sesion %s no tiene correo capturado.",
            cita.folio,
            miembro_sesion.id,
        )
        return notif

    try:
        subject = f"Cita cancelada — {cita.folio}"
        body = (
            f"Hola {miembro_sesion.nombre_visible},\n\n"
            f"La cita con folio {cita.folio}, programada para el "
            f"{cita.fecha_hora.strftime('%d/%m/%Y %H:%M')}, fue cancelada.\n\n"
            "Si fue un error o necesitas otra fecha, puedes agendar una "
            "nueva cita desde el portal."
        )

        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email_destino],
        )
        email.send(fail_silently=False)

        notif.enviado = True
        notif.enviado_at = timezone.now()
        notif.save(update_fields=["enviado", "enviado_at"])
    except Exception:
        logger.exception("Error enviando el correo de cancelación portal para cita %s", cita.folio)

    return notif
