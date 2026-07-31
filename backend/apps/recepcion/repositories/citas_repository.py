"""
Repositorio de citas médicas.

Encapsula todo acceso a CitaMedica y HorarioDisponible.
"""

import math
from datetime import date, timedelta

from django.db import transaction

from apps.recepcion.models import CitaMedica, EstatusCita, HorarioDisponible


# ── Helpers ───────────────────────────────────────────────────────────────────

def _serialize_cita(cita: CitaMedica) -> dict:
    det = getattr(cita.medico.id_usuario, "detalle", None)
    return {
        "id":             cita.id,
        "folio":          cita.folio,
        "noExp":          cita.no_exp,
        "pkNum":          cita.pk_num,
        "medicoId":       cita.medico_id,
        "medicoNombre":   det.nombre_completo if det else str(cita.medico_id),
        "consultorioId":  cita.consultorio_id,
        "consultorioNombre": (
            f"#{cita.consultorio.numero} — {cita.consultorio.name}"
            if cita.consultorio else None
        ),
        "fechaHora":      cita.fecha_hora.isoformat(),
        "duracionMin":    cita.duracion_min,
        "servicioTipo":   cita.servicio_tipo,
        "estatus":        cita.estatus,
        "motivo":         cita.motivo,
        "notas":          cita.notas,
        "createdAt":      cita.created_at.isoformat(),
    }


# ── Repositorio ───────────────────────────────────────────────────────────────

class CitasRepository:

    # ── Citas ─────────────────────────────────────────────────────────────────

    @staticmethod
    def get_by_id(cita_id: int) -> CitaMedica | None:
        return (
            CitaMedica.objects
            .select_related("medico__id_usuario__detalle", "consultorio")
            .filter(id=cita_id)
            .first()
        )

    @staticmethod
    def get_by_folio(folio: str) -> CitaMedica | None:
        return (
            CitaMedica.objects
            .select_related("medico__id_usuario__detalle", "consultorio")
            .filter(folio=folio)
            .first()
        )

    @staticmethod
    def list_paginated(
        page: int,
        page_size: int,
        medico_id: int | None = None,
        consultorio_id: int | None = None,
        centro_id: int | None = None,
        no_exp: str | None = None,
        folio: str | None = None,
        estatus: str | None = None,
        fecha_desde: date | None = None,
        fecha_hasta: date | None = None,
    ) -> tuple[list[dict], int, int]:
        qs = (
            CitaMedica.objects
            .select_related("medico__id_usuario__detalle", "consultorio__id_center")
            .order_by("fecha_hora")
        )

        if medico_id:
            qs = qs.filter(medico_id=medico_id)
        if consultorio_id:
            qs = qs.filter(consultorio_id=consultorio_id)
        if centro_id:
            qs = qs.filter(consultorio__id_center_id=centro_id)
        if no_exp:
            qs = qs.filter(no_exp=no_exp)
        if folio:
            qs = qs.filter(folio__icontains=folio)
        if estatus:
            qs = qs.filter(estatus=estatus)
        if fecha_desde:
            qs = qs.filter(fecha_hora__date__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha_hora__date__lte=fecha_hasta)

        total       = qs.count()
        start       = (page - 1) * page_size
        items       = [_serialize_cita(c) for c in qs[start: start + page_size]]
        total_pages = math.ceil(total / page_size) if total else 0

        return items, total, total_pages

    @staticmethod
    def create(
        no_exp: str,
        pk_num: int,
        medico_id: int,
        fecha_hora,
        servicio_tipo: str = "medicina_general",
        consultorio_id: int | None = None,
        duracion_min: int = 20,
        motivo: str | None = None,
        notas: str | None = None,
        created_by_id: int | None = None,
    ) -> dict:
        # Valida disponibilidad del médico (status, horario, excepciones) ANTES de
        # abrir la transacción porque es una consulta más costosa.
        from apps.medicos.models import CatMedico
        from apps.medicos.disponibilidad import get_disponibilidad_medico
        medico = CatMedico.objects.filter(id_usuario_id=medico_id).first()
        if medico:
            disp = get_disponibilidad_medico(medico, fecha_hora.date())
            if not disp["disponible"]:
                raise ValueError(f"El médico no está disponible: {disp['motivo']}")
            exc_parcial = disp.get("excepcionParcial")
            if exc_parcial:
                from datetime import time as _time
                exc_inicio = _time.fromisoformat(str(exc_parcial["horaInicio"])[:5])
                exc_fin    = _time.fromisoformat(str(exc_parcial["horaFin"])[:5])
                hora_cita  = fecha_hora.time().replace(second=0, microsecond=0)
                if exc_inicio <= hora_cita < exc_fin:
                    tipo = exc_parcial["tipo"].lower().replace("_", " ")
                    raise ValueError(
                        f"El médico tiene {tipo} de "
                        f"{str(exc_parcial['horaInicio'])[:5]} a "
                        f"{str(exc_parcial['horaFin'])[:5]}."
                    )

        with transaction.atomic():
            # 1. Bloquea la fila del slot con SELECT FOR UPDATE.
            #    Si dos requests llegan al mismo tiempo, el segundo espera
            #    hasta que el primero libere la transacción. Al salir del bloqueo
            #    encontrará disponible=False y fallará correctamente.
            slot = (
                HorarioDisponible.objects
                .select_for_update()
                .filter(
                    medico_id=medico_id,
                    fecha=fecha_hora.date(),
                    hora=fecha_hora.time(),
                    disponible=True,
                )
                .first()
            )
            if not slot:
                raise ValueError("El horario seleccionado no está disponible.")

            # 1.1 Slots con canal="LINEA" son exclusivos del portal de citas en
            #     línea — no se pueden agendar desde recepción, aunque sigan
            #     marcados disponible=True.
            if slot.canal == "LINEA":
                raise ValueError(
                    "Este horario está reservado exclusivamente para citas en "
                    "línea, no se puede agendar desde recepción."
                )

            # 2. El médico no debe tener otra cita activa en ese momento
            if CitaMedica.objects.filter(
                medico_id=medico_id,
                fecha_hora=fecha_hora,
                estatus__in=[EstatusCita.AGENDADA, EstatusCita.CONFIRMADA],
            ).exists():
                raise ValueError("El médico ya tiene una cita agendada en ese horario.")

            # 3. El paciente no debe tener otra cita activa a la misma hora
            if CitaMedica.objects.filter(
                no_exp=no_exp,
                pk_num=pk_num,
                fecha_hora=fecha_hora,
                estatus__in=[EstatusCita.AGENDADA, EstatusCita.CONFIRMADA],
            ).exists():
                raise ValueError("El paciente ya tiene una cita agendada en ese horario.")

            cita = CitaMedica.objects.create(
                folio=CitaMedica.generar_folio(),
                no_exp=no_exp,
                pk_num=pk_num,
                medico_id=medico_id,
                consultorio_id=consultorio_id,
                fecha_hora=fecha_hora,
                duracion_min=duracion_min,
                servicio_tipo=servicio_tipo,
                motivo=motivo,
                notas=notas,
                created_by_id=created_by_id,
            )

            # Marcar el slot como ocupado dentro de la misma transacción
            slot.disponible = False
            slot.cita = cita
            slot.save(update_fields=["disponible", "cita_id"])

        cita.refresh_from_db()
        cita = CitaMedica.objects.select_related(
            "medico__id_usuario__detalle", "consultorio"
        ).get(id=cita.id)
        return _serialize_cita(cita)

    @staticmethod
    def update_estatus(cita: CitaMedica, estatus: str) -> dict:
        with transaction.atomic():
            cita.estatus = estatus
            cita.save(update_fields=["estatus", "updated_at"])

            # Liberar slot si se cancela o no asistió — dentro de la misma transacción
            if estatus in (EstatusCita.CANCELADA, EstatusCita.NO_ASISTIO):
                HorarioDisponible.objects.filter(cita=cita).update(
                    disponible=True, cita=None
                )

        cita = CitaMedica.objects.select_related(
            "medico__id_usuario__detalle", "consultorio"
        ).get(id=cita.id)
        return _serialize_cita(cita)

    # ── Slots ─────────────────────────────────────────────────────────────────

    @staticmethod
    def generar_slots_medico(medico_id: int, dias_adelante: int = 30) -> int:
        """
        Genera HorarioDisponible para un médico basado en su horario semanal.
        Idempotente — usa get_or_create.
        """
        from apps.medicos.models import RelMedicoConsultorio

        dia_nombre_a_weekday = {
            "LUNES": 0, "MARTES": 1, "MIERCOLES": 2, "JUEVES": 3,
            "VIERNES": 4, "SABADO": 5, "DOMINGO": 6,
        }

        hoy      = date.today()
        creados  = 0

        rmcs = (
            RelMedicoConsultorio.objects
            .prefetch_related("horarios")
            .filter(medico_id=medico_id, is_active=True)
        )

        for rmc in rmcs:
            for horario in rmc.horarios.all():
                weekday = dia_nombre_a_weekday.get(horario.dia_semana)
                if weekday is None:
                    continue

                intervalo = horario.intervalo_cita_min or 20
                inicio    = horario.hora_inicio
                fin       = horario.hora_fin

                for delta in range(dias_adelante):
                    dia = hoy + timedelta(days=delta)
                    if dia.weekday() != weekday:
                        continue

                    # Generar slots dentro del rango hora_inicio→hora_fin
                    from datetime import datetime, time
                    slot_time = datetime.combine(dia, inicio)
                    fin_dt    = datetime.combine(dia, fin)

                    while slot_time < fin_dt:
                        _, created = HorarioDisponible.objects.get_or_create(
                            medico_id=medico_id,
                            fecha=dia,
                            hora=slot_time.time(),
                            defaults={
                                "consultorio_id": rmc.consultorio_id,
                                "duracion_min":   intervalo,
                                "disponible":     True,
                                "canal":          horario.canal,
                            },
                        )
                        if created:
                            creados += 1
                        from datetime import timedelta as td
                        slot_time += td(minutes=intervalo)

        return creados

    @staticmethod
    def get_slots_disponibles(
        medico_id: int,
        fecha: date,
    ) -> list[dict]:
        slots = (
            HorarioDisponible.objects
            .filter(medico_id=medico_id, fecha=fecha, disponible=True)
            .order_by("hora")
        )
        return [
            {
                "fecha":        str(s.fecha),
                "hora":         str(s.hora)[:5],
                "duracionMin":  s.duracion_min,
                "consultorioId": s.consultorio_id,
            }
            for s in slots
        ]
