import math
import uuid

from django.core.exceptions import ObjectDoesNotExist

from apps.authentication.models import DetUsuario
from apps.recepcion.models import Visit
from apps.somatometria.repositories.vitals_repository import VitalsRepository


class VisitRepository:

    @staticmethod
    def create(
        no_exp: str,
        pk_num: int = 0,
        nombre_paciente: str | None = None,
        arrival_type: str = Visit.ArrivalType.WALK_IN,
        service_type: str = Visit.ServiceType.MEDICINA_GENERAL,
        appointment_id: str | None = None,
        doctor_id: int | None = None,
        consultorio_id: int | None = None,
        notes: str | None = None,
        hora_consulta=None,
        num_ficha: int | None = None,
        turno_nombre: str | None = None,
    ) -> Visit:
        return Visit.objects.create(
            folio=VisitRepository._build_folio(),
            no_exp=no_exp,
            pk_num=pk_num,
            nombre_paciente=nombre_paciente,
            arrival_type=arrival_type,
            service_type=service_type,
            appointment_id=appointment_id,
            doctor_id=doctor_id,
            consultorio_id=consultorio_id,
            notes=notes,
            hora_consulta=hora_consulta,
            num_ficha=num_ficha,
            turno_nombre=turno_nombre,
            status="en_espera",
        )

    @staticmethod
    def get_by_id(visit_id: int) -> Visit | None:
        return (
            Visit.objects
            .select_related("consultorio__id_center", "vital_signs")
            .filter(id_visit=visit_id)
            .first()
        )

    @staticmethod
    def exists_open_visit_for_patient(no_exp: str, pk_num: int) -> bool:
        """Verifica que el paciente no tenga ya una visita activa en el mismo día."""
        return Visit.objects.filter(
            no_exp=no_exp,
            pk_num=pk_num,
            fch_baja__isnull=True,
            status__in=("en_espera", "en_somatometria", "lista_para_doctor", "en_consulta"),
        ).exists()

    @staticmethod
    def update_status(visit: Visit, status_value: str) -> Visit:
        visit.status = status_value
        visit.save(update_fields=["status", "fch_modf"])
        return visit

    @staticmethod
    def list_paginated(
        page: int,
        page_size: int,
        status_filter: str | None = None,
        date_filter=None,
        doctor_id: int | None = None,
        consultorio_id: int | None = None,
        centro_id: int | None = None,
        service_type: str | None = None,
        no_exp: str | None = None,
    ) -> tuple[list[Visit], int, int]:
        queryset = (
            Visit.objects
            .select_related("consultorio__id_center", "vital_signs")
            .order_by("-id_visit")
        )

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if date_filter:
            queryset = queryset.filter(fch_alta__date=date_filter)
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        if consultorio_id:
            queryset = queryset.filter(consultorio_id=consultorio_id)
        if centro_id:
            queryset = queryset.filter(consultorio__id_center_id=centro_id)
        if service_type:
            queryset = queryset.filter(service_type=service_type)
        if no_exp:
            queryset = queryset.filter(no_exp=no_exp)

        total       = queryset.count()
        start       = (page - 1) * page_size
        visits      = list(queryset[start: start + page_size])
        total_pages = math.ceil(total / page_size) if total else 0

        # Enriquecer con nombre del médico (batch lookup, evita N+1)
        doctor_ids = {v.doctor_id for v in visits if v.doctor_id}
        doctor_nombres: dict[int, str] = {}
        if doctor_ids:
            dets = DetUsuario.objects.filter(id_usuario_id__in=doctor_ids)
            doctor_nombres = {d.id_usuario_id: d.nombre_completo for d in dets}

        return visits, total, total_pages, doctor_nombres

    @staticmethod
    def to_contract(visit: Visit, doctor_nombres: dict | None = None) -> dict:
        try:
            vital_signs = visit.vital_signs
        except ObjectDoesNotExist:
            vital_signs = None

        doctor_nombre = None
        if visit.doctor_id and doctor_nombres:
            doctor_nombre = doctor_nombres.get(visit.doctor_id)

        consultorio_nombre = None
        centro_nombre      = None
        centro_id          = None
        if visit.consultorio_id:
            try:
                if visit.consultorio:
                    consultorio_nombre = f"#{visit.consultorio.numero} — {visit.consultorio.name}"
                    if visit.consultorio.id_center:
                        centro_nombre = visit.consultorio.id_center.name
                        centro_id     = visit.consultorio.id_center.id
            except Exception:
                pass

        return {
            "id":                visit.id_visit,
            "folio":             visit.folio,
            # no_exp puede ser null en registros anteriores a la migración 0003.
            "noExp":             visit.no_exp or "",
            "pkNum":             visit.pk_num,
            "nombrePaciente":    visit.nombre_paciente,
            "arrivalType":       visit.arrival_type,
            "serviceType":       visit.service_type,
            "appointmentId":     visit.appointment_id,
            "doctorId":          visit.doctor_id,
            "doctorNombre":      doctor_nombre,
            "consultorioId":     visit.consultorio_id,
            "consultorioNombre": consultorio_nombre,
            "centroId":          centro_id,
            "centroNombre":      centro_nombre,
            "notes":             visit.notes,
            "horaConsulta":      visit.hora_consulta.strftime("%H:%M") if visit.hora_consulta else None,
            "numFicha":          visit.num_ficha,
            "turnoNombre":       visit.turno_nombre or "",
            "status":            visit.status,
            "fechaAlta":         visit.fch_alta.isoformat() if visit.fch_alta else None,
            "vitals": (
                VitalsRepository.to_contract(vital_signs)
                if vital_signs is not None
                else None
            ),
        }

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _build_folio() -> str:
        return f"VIS-{uuid.uuid4().hex[:12].upper()}"
