"""
apps/recepcion/repositories/citas_repository.py
================================================
CRUD de citas médicas y gestión de slots de disponibilidad.

RN-06: select_for_update() + @transaction.atomic en crear y cancelar.
RN-04/05: UNIQUE INDEX parcial en DB — segunda barrera de seguridad.
RN-07: liberar slot al cancelar en la misma transacción.
"""

from datetime import date, datetime, timedelta
from typing import Optional
import logging

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from ..models import (
    CitaMedica, CitaNotificacion, HorarioDisponible,
    EstatusCita, CatMedicoClin, CatConsultorio, CatCentroAtencion,
)

logger = logging.getLogger(__name__)


class CitasRepository:

    # ─── Crear cita ───────────────────────────────────────────────────────────

    @transaction.atomic
    def crear_cita(self, datos: dict) -> CitaMedica:
        """
        Crea la cita y marca el slot como no disponible.
        select_for_update() bloquea el slot para evitar doble agendamiento.
        Lanza ValueError si no hay slot disponible o hay conflicto.
        """
        # 1. Bloquear slot (RN-06)
        slot = (
            HorarioDisponible.objects
            .select_for_update()
            .filter(
                medico_id=datos["medico_id"],
                fecha_hora=datos["fecha_hora"],
                disponible=True,
            )
            .first()
        )
        if not slot:
            raise ValueError("El horario seleccionado ya no está disponible.")

        # 2. Verificar conflicto en consultorio (segunda barrera — RN-04)
        if CitaMedica.objects.filter(
            consultorio_id=datos["consultorio_id"],
            fecha_hora=datos["fecha_hora"],
        ).exclude(estatus=EstatusCita.CANCELADA).exists():
            raise ValueError("El consultorio ya está ocupado en esa fecha y hora.")

        # 3. Snapshots de nombres (RN-10)
        try:
            medico  = CatMedicoClin.objects.get(id_medclin=datos["medico_id"])
            centro  = CatCentroAtencion.objects.get(id_centro_atencion=datos["centro_atencion_id"])
            consult = CatConsultorio.objects.get(id_consult=datos["consultorio_id"])
        except Exception as exc:
            raise ValueError(f"No se encontró médico/centro/consultorio: {exc}")

        # 4. Crear cita
        cita = CitaMedica.objects.create(
            tipo_paciente=datos["tipo_paciente"],
            no_exp=datos["no_exp"],
            pk_num=datos["pk_num"],
            medico_id=datos["medico_id"],
            centro_atencion_id=datos["centro_atencion_id"],
            consultorio_id=datos["consultorio_id"],
            fecha_hora=datos["fecha_hora"],
            motivo=datos.get("motivo", ""),
            nombre_paciente=datos["nombre_paciente"],
            nombre_medico=medico.nombre_completo,
            nombre_centro=centro.nombre,
            nombre_consult=consult.consult,
            creado_por=datos.get("creado_por"),
        )

        # 5. Marcar slot ocupado (RN-07 inverso)
        slot.disponible = False
        slot.save(update_fields=["disponible"])

        return cita

    # ─── Cancelar cita ────────────────────────────────────────────────────────

    @transaction.atomic
    def cancelar_cita(self, cita_id, motivo: str = "") -> CitaMedica:
        """RN-07: libera el slot en la misma transacción."""
        try:
            cita = CitaMedica.objects.select_for_update().get(id=cita_id)
        except CitaMedica.DoesNotExist:
            raise ValueError("Cita no encontrada.")

        if cita.estatus in (EstatusCita.CANCELADA, EstatusCita.ATENDIDA):
            raise ValueError(f"No se puede cancelar una cita con estatus '{cita.get_estatus_display()}'.")

        cita.estatus      = EstatusCita.CANCELADA
        cita.observaciones = motivo
        cita.save(update_fields=["estatus", "observaciones", "updated_at"])

        # Liberar slot (RN-07)
        HorarioDisponible.objects.filter(
            medico_id=cita.medico_id,
            fecha_hora=cita.fecha_hora,
        ).update(disponible=True)

        return cita

    # ─── Confirmar asistencia (desde token de correo) ─────────────────────────

    @transaction.atomic
    def confirmar_cita(self, cita_id) -> CitaMedica:
        try:
            cita = CitaMedica.objects.select_for_update().get(id=cita_id)
        except CitaMedica.DoesNotExist:
            raise ValueError("Cita no encontrada.")

        if cita.estatus != EstatusCita.AGENDADA:
            raise ValueError("Solo se pueden confirmar citas en estatus agendada.")

        cita.estatus = EstatusCita.CONFIRMADA
        cita.save(update_fields=["estatus", "updated_at"])
        return cita

    # ─── Consultar disponibilidad ─────────────────────────────────────────────

    def get_disponibilidad(
        self,
        medico_id: int,
        fecha_inicio: date,
        fecha_fin: date,
    ) -> list[dict]:
        return list(
            HorarioDisponible.objects
            .filter(
                medico_id=medico_id,
                disponible=True,
                fecha_hora__date__gte=fecha_inicio,
                fecha_hora__date__lte=fecha_fin,
                fecha_hora__gt=timezone.now(),
            )
            .order_by("fecha_hora")
            .values("id", "fecha_hora", "consultorio_id", "centro_atencion_id")
        )

    # ─── Listar citas con filtros (dashboard recepcionista) ───────────────────

    def listar_citas(
        self,
        fecha: Optional[date] = None,
        centro_atencion_id: Optional[int] = None,
        medico_id: Optional[int] = None,
        estatus: Optional[str] = None,
        no_exp: Optional[int] = None,
        busqueda: Optional[str] = None,
        page: int = 1,
        page_size: int = 30,
    ) -> dict:
        qs = CitaMedica.objects.all()

        if fecha:
            qs = qs.filter(fecha_hora__date=fecha)
        if centro_atencion_id:
            qs = qs.filter(centro_atencion_id=centro_atencion_id)
        if medico_id:
            qs = qs.filter(medico_id=medico_id)
        if estatus:
            qs = qs.filter(estatus=estatus)
        if no_exp:
            qs = qs.filter(no_exp=no_exp)
        if busqueda:
            qs = qs.filter(
                Q(nombre_paciente__icontains=busqueda)
                | Q(no_exp__icontains=busqueda)
            )

        total  = qs.count()
        offset = (page - 1) * page_size
        items  = list(qs.order_by("fecha_hora")[offset : offset + page_size])

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": max(1, (total + page_size - 1) // page_size),
            "results": items,
        }

    # ─── Generar slots desde horario de un médico ─────────────────────────────

    def generar_slots_medico(self, medico_id: int, dias_adelante: int = 30) -> int:
        """
        Genera HorarioDisponible para los próximos N días.
        Idempotente: usa get_or_create.
        Retorna cantidad de slots nuevos creados.
        """
        from datetime import time as dt_time

        try:
            medico = CatMedicoClin.objects.get(id_medclin=medico_id)
        except CatMedicoClin.DoesNotExist:
            return 0

        if not medico.hr_ini or not medico.interv_consul:
            return 0

        DIA_MAP = {"L": 0, "M": 1, "J": 3, "V": 4, "S": 5, "D": 6}
        # "MI" = miércoles — soporte especial
        raw_dias = medico.dias or "LMJV"
        dias_set: set[int] = set()
        i = 0
        while i < len(raw_dias):
            if raw_dias[i:i+2] == "MI":
                dias_set.add(2)
                i += 2
            elif raw_dias[i] in DIA_MAP:
                dias_set.add(DIA_MAP[raw_dias[i]])
                i += 1
            else:
                i += 1

        def parse_hora(h: str) -> dt_time:
            h = h.replace(":", "").zfill(4)
            return dt_time(int(h[:2]), int(h[2:]))

        creados = 0
        hoy     = timezone.now().date()

        for turno_ini, turno_fin, interv, consult_id in [
            (medico.hr_ini, medico.hr_term, medico.interv_consul, medico.id_consult),
            (medico.hr_ini2, medico.hr_term2, medico.interv_consul2, medico.id_consult2),
        ]:
            if not turno_ini or not interv or not consult_id:
                continue
            try:
                h_ini = parse_hora(turno_ini)
                h_fin = parse_hora(turno_fin) if turno_fin else None
            except (ValueError, TypeError):
                continue

            for delta in range(dias_adelante):
                dia = hoy + timedelta(days=delta)
                if dia.weekday() not in dias_set:
                    continue

                slot_dt = timezone.make_aware(datetime.combine(dia, h_ini))

                while True:
                    if h_fin and slot_dt.time() >= h_fin:
                        break
                    _, created = HorarioDisponible.objects.get_or_create(
                        medico_id=medico_id,
                        fecha_hora=slot_dt,
                        defaults={
                            "consultorio_id":     consult_id,
                            "centro_atencion_id": medico.id_centro_atencion or 0,
                            "disponible":         True,
                        },
                    )
                    if created:
                        creados += 1
                    slot_dt += timedelta(minutes=interv)

        return creados