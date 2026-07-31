"""
apps/portal_citas/tasks.py
=============================
Tareas Celery del portal de Citas en Línea (Fase 5).

Sigue el mismo patrón de ``apps.recepcion.tasks``: ``@shared_task`` (no
``@app.task`` directo, así no depende de importar la instancia ``Celery``
de ``config.celery``), ``bind=True`` + ``max_retries``/``default_retry_delay``
para poder reintentar con ``self.retry(...)``, logging con ``logger.exception``
en los ``except`` y devolver un dict resumen al final de la tarea.
"""

import logging

from celery import shared_task

from apps.portal_citas.models import PortalMiembro
from apps.portal_citas.services.notificacion_service import (
    enviar_cancelacion_portal,
    enviar_comprobante_portal,
)
from apps.recepcion.models import CitaMedica

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def enviar_comprobante_portal_task(self, folio: str, miembro_objetivo_id: str, miembro_sesion_id: str):
    """
    Genera el PDF+QR del comprobante de una cita reservada desde el
    portal y lo envía por correo al adulto que hizo la reserva.

    Se dispara con ``.delay(...)`` desde
    ``uses_case.reservar_cita_usecase.reservar_cita`` justo después de que
    la transacción que crea la ``CitaMedica`` confirma exitosamente -- el
    endpoint ``POST /api/v1/portal/citas/`` NO espera a que esta tarea
    termine, responde apenas la cita queda creada.

    Argumentos como IDs planos (folio ``str``, UUIDs como ``str``) en vez
    de instancias de modelo -- Celery serializa los argumentos a JSON
    (``CELERY_TASK_SERIALIZER = "json"``), así que no pueden viajar
    objetos Django directamente.
    """
    try:
        cita = CitaMedica.objects.select_related(
            "medico__id_usuario__detalle", "consultorio"
        ).get(folio=folio)
        miembro_objetivo = PortalMiembro.objects.get(id=miembro_objetivo_id)
        miembro_sesion = PortalMiembro.objects.get(id=miembro_sesion_id)
    except (CitaMedica.DoesNotExist, PortalMiembro.DoesNotExist) as exc:
        # No hay nada que reintentar: si la cita o los miembros no existen
        # ahora, tampoco van a existir en un próximo intento.
        logger.error(
            "No se pudo generar el comprobante portal, folio=%s: %s", folio, exc
        )
        return {"folio": folio, "enviado": False, "motivo": "datos_no_encontrados"}

    try:
        notif = enviar_comprobante_portal(cita, miembro_objetivo, miembro_sesion)
    except Exception as exc:
        # enviar_comprobante_portal ya atrapa errores del envío de correo en
        # sí (deja enviado=False sin propagar la excepción). Si igual llega
        # una excepción hasta acá es algo inesperado (ej. PDF/QR rotos) --
        # ahí sí vale la pena reintentar.
        logger.exception(
            "Error inesperado generando el comprobante portal, folio=%s", folio
        )
        raise self.retry(exc=exc)

    logger.info(
        "Comprobante portal procesado. folio=%s enviado=%s", folio, notif.enviado
    )
    return {"folio": folio, "enviado": notif.enviado}


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def enviar_cancelacion_portal_task(self, folio: str, miembro_sesion_id: str):
    """
    Envía el correo de confirmación de cancelación de una cita del portal
    (Fase 6).

    Se dispara con ``.delay(...)`` desde
    ``uses_case.cancelar_cita_usecase.cancelar_cita`` justo después de que
    la transacción que marca la ``CitaMedica`` como ``cancelada`` confirma
    exitosamente -- el endpoint ``PATCH /api/v1/portal/citas/{folio}/cancelar/``
    NO espera a que esta tarea termine.

    Mismos argumentos como IDs planos (folio ``str``, UUID como ``str``) que
    ``enviar_comprobante_portal_task``, por la misma razón: Celery serializa
    a JSON, no pueden viajar instancias de modelo directamente.
    """
    try:
        cita = CitaMedica.objects.select_related(
            "medico__id_usuario__detalle", "consultorio"
        ).get(folio=folio)
        miembro_sesion = PortalMiembro.objects.get(id=miembro_sesion_id)
    except (CitaMedica.DoesNotExist, PortalMiembro.DoesNotExist) as exc:
        # No hay nada que reintentar: si la cita o el miembro no existen
        # ahora, tampoco van a existir en un próximo intento.
        logger.error(
            "No se pudo enviar el correo de cancelación portal, folio=%s: %s", folio, exc
        )
        return {"folio": folio, "enviado": False, "motivo": "datos_no_encontrados"}

    try:
        notif = enviar_cancelacion_portal(cita, miembro_sesion)
    except Exception as exc:
        # enviar_cancelacion_portal ya atrapa errores del envío de correo en
        # sí (deja enviado=False sin propagar la excepción). Si igual llega
        # una excepción hasta acá es algo inesperado -- ahí sí vale la pena
        # reintentar.
        logger.exception(
            "Error inesperado enviando el correo de cancelación portal, folio=%s", folio
        )
        raise self.retry(exc=exc)

    logger.info(
        "Correo de cancelación portal procesado. folio=%s enviado=%s", folio, notif.enviado
    )
    return {"folio": folio, "enviado": notif.enviado}
