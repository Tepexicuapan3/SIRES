"""
apps/recepcion/tasks.py
=======================
Tareas Celery del módulo Citas Médicas.
"""

import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from .models import CitaMedica, EstatusCita, CatMedicoClin
from .repositories.citas_repository import CitasRepository
from .services.notificacion_service import NotificacionCitaService

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def enviar_recordatorios_proximos(self):
    """
    Diario a las 8am.

    Envía recordatorio a citas en ventana:
    now + 23h  <= fecha_hora <= now + 25h

    No reenvía si ya existe un recordatorio enviado para esa cita.
    """
    ahora = timezone.now()
    desde = ahora + timedelta(hours=23)
    hasta = ahora + timedelta(hours=25)

    notif_svc = NotificacionCitaService()

    citas = (
        CitaMedica.objects.filter(
            fecha_hora__gte=desde,
            fecha_hora__lte=hasta,
            estatus__in=[EstatusCita.AGENDADA, EstatusCita.CONFIRMADA],
        )
        .order_by("fecha_hora")
    )

    enviados = 0
    errores = 0
    revisadas = 0

    for cita in citas:
        revisadas += 1

        notif_orig = (
            cita.notificaciones.filter(
                tipo="confirmacion",
                enviado=True,
            )
            .order_by("-created_at")
            .first()
        )
        if not notif_orig or not notif_orig.email_destino:
            continue

        ya_enviado = cita.notificaciones.filter(
            tipo="recordatorio",
            enviado=True,
        ).exists()
        if ya_enviado:
            continue

        try:
            notif_svc.enviar_recordatorio(cita, notif_orig.email_destino)
            enviados += 1
        except Exception as exc:
            logger.exception("Error enviando recordatorio para cita %s: %s", cita.id, exc)
            errores += 1

    logger.info(
        "Recordatorios procesados. revisadas=%s enviados=%s errores=%s ventana=(%s -> %s)",
        revisadas,
        enviados,
        errores,
        desde,
        hasta,
    )
    return {
        "revisadas": revisadas,
        "enviados": enviados,
        "errores": errores,
    }


@shared_task(bind=True, max_retries=2, default_retry_delay=600)
def generar_slots_todos_medicos(self):
    """
    Lunes a la 1am.

    Genera slots para los próximos 30 días para todos los médicos activos.
    Idempotente mediante get_or_create.
    """
    citas_repo = CitasRepository()

    medicos = (
        CatMedicoClin.objects.filter(est_medclin="A")
        .order_by("id_medclin")
    )

    total_slots = 0
    total_medicos = 0
    errores = 0

    for medico in medicos:
        try:
            creados = citas_repo.generar_slots_medico(
                medico_id=medico.id_medclin,
                dias_adelante=30,
            )
            total_slots += creados
            total_medicos += 1
        except Exception as exc:
            errores += 1
            logger.exception("Error generando slots para médico %s: %s", medico.id_medclin, exc)

    logger.info(
        "Generación de slots completada. medicos=%s slots_creados=%s errores=%s",
        total_medicos,
        total_slots,
        errores,
    )
    return {
        "medicos": total_medicos,
        "slots_creados": total_slots,
        "errores": errores,
    }


@shared_task
def marcar_no_asistio():
    """
    Cada hora.

    Citas con fecha_hora <= now - 2h y estatus agendada/confirmada
    pasan a no_asistio.
    """
    ahora = timezone.now()
    limite = ahora - timedelta(hours=2)

    actualizadas = CitaMedica.objects.filter(
        fecha_hora__lte=limite,
        estatus__in=[EstatusCita.AGENDADA, EstatusCita.CONFIRMADA],
    ).update(
        estatus=EstatusCita.NO_ASISTIO,
        updated_at=ahora,
    )

    logger.info("Citas marcadas como no_asistio: %s (limite=%s)", actualizadas, limite)
    return {"actualizadas": actualizadas}