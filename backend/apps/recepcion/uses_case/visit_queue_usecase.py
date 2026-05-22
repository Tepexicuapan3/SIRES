from django.db import transaction

from apps.administracion.use_cases.expedientes.buscar_expediente import buscar_expediente
from apps.authentication.services.authorization_service import has_capability
from apps.recepcion.models import HorarioDisponible, Visit
from apps.recepcion.repositories.visit_repository import VisitRepository
from apps.recepcion.services.errors import VisitDomainError
from apps.recepcion.uses_case.visit_state_machine_usecase import (
    ROLE_RECEPCION,
    transition_visit_state,
)

_ACTIVE_VISIT_STATUSES = (
    "en_espera", "en_somatometria", "lista_para_doctor", "en_consulta",
)

RECEPCION_WRITE_CAPABILITY = "flow.recepcion.queue.write"
VISIT_QUEUE_READ_CAPABILITY = "flow.visits.queue.read"


# ── Autorización ──────────────────────────────────────────────────────────────

def ensure_recepcion_role(roles, permissions=None):
    del roles
    if has_capability(permissions or [], RECEPCION_WRITE_CAPABILITY):
        return
    raise VisitDomainError("ROLE_NOT_ALLOWED", "No tienes permiso para esta acción.", 403)


def ensure_visit_queue_access(roles, permissions):
    del roles
    if has_capability(permissions or [], VISIT_QUEUE_READ_CAPABILITY):
        return
    raise VisitDomainError("ROLE_NOT_ALLOWED", "No tienes permiso para esta acción.", 403)


# ── Pacientes ─────────────────────────────────────────────────────────────────

def _build_member(source: dict, pk_num: int, no_exp_key: str) -> dict:
    """Construye el dict de un miembro a partir de una fila de SERMED."""
    return {
        "noExp":      source[no_exp_key],
        "pkNum":      pk_num,
        "nombre":     f"{source['DS_PATERNO']} {source['DS_MATERNO']} {source['DS_NOMBRE']}".strip(),
        "edad":       source.get("EDAD"),
        "fechaNac":   str(source["FE_NAC"]) if source.get("FE_NAC") else None,
        "parentesco": source.get("CD_PARENTESCO", "TRABAJADOR"),
        "estatus":    source.get("ESTATUS", ""),
        "cdClinica":  source.get("CD_CLINICA"),
    }


def lookup_patient(no_exp: str, historico: bool = False) -> dict:
    """
    Busca el titular y sus derechohabientes por expediente.

    historico=False (default): solo retorna miembros ACTIVOS — usado en check-in.
    historico=True: retorna todos sin filtrar estatus — usado en vista de fichas.
    """
    if not no_exp:
        raise VisitDomainError("VALIDATION_ERROR", "El número de expediente es requerido.", 400)

    resultado  = buscar_expediente(no_exp)
    empleados  = resultado.get("empleados",  [])
    familiares = resultado.get("familiares", [])

    if not empleados:
        raise VisitDomainError("PATIENT_NOT_FOUND", "Expediente no encontrado.", 404)

    emp = empleados[0]

    # Titular
    es_activo_titular = emp.get("ESTATUS") == "ACTIVO"
    titular = _build_member(emp, 0, "NO_EXP") if (historico or es_activo_titular) else None

    # Derechohabientes
    dependientes = [
        _build_member(fam, fam["PK_NUM"], "NO_EXPF")
        for fam in familiares
        if historico or fam.get("ESTATUS") == "ACTIVO"
    ]

    if not historico and titular is None and not dependientes:
        raise VisitDomainError(
            "PATIENT_NO_SERVICE",
            "El trabajador está de baja y no hay derechohabientes con vigencia activa.",
            404,
        )

    return {"titular": titular, "dependientes": dependientes}


# ── Visitas ───────────────────────────────────────────────────────────────────

def _check_and_reserve_slot(doctor_id: int, hora_consulta) -> None:
    """
    Verifica que el médico no tenga ya una ficha activa en ese horario hoy
    y marca el slot de HorarioDisponible como ocupado.

    Usa SELECT FOR UPDATE sobre el slot para evitar race conditions cuando
    dos requests llegan simultáneamente al mismo horario.
    """
    from django.utils import timezone

    hoy = timezone.localtime(timezone.now()).date()

    with transaction.atomic():
        # Intentar bloquear el slot (previene race condition cuando el slot existe)
        slot = (
            HorarioDisponible.objects
            .select_for_update()
            .filter(medico_id=doctor_id, fecha=hoy, hora=hora_consulta)
            .first()
        )

        if slot and not slot.disponible:
            raise VisitDomainError(
                "VISIT_SLOT_CONFLICT",
                "El horario seleccionado ya está ocupado.",
                409,
            )

        # Validación a nivel de Visit (cubre el caso en que no existe slot generado)
        if Visit.objects.filter(
            doctor_id=doctor_id,
            hora_consulta=hora_consulta,
            fch_alta__date=hoy,
            fch_baja__isnull=True,
            status__in=_ACTIVE_VISIT_STATUSES,
        ).exists():
            raise VisitDomainError(
                "VISIT_SLOT_CONFLICT",
                "El médico ya tiene una ficha para ese horario.",
                409,
            )

        if slot:
            slot.disponible = False
            slot.save(update_fields=["disponible"])


def create_visit(
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
) -> dict:
    if VisitRepository.exists_open_visit_for_patient(no_exp, pk_num):
        raise VisitDomainError(
            "VISIT_DUPLICATE_SUBMIT",
            "Ya existe una visita abierta para este paciente.",
            409,
        )

    # Fallback: si el frontend no mandó hora, tomarla del horario del médico
    if not hora_consulta and doctor_id:
        hora_consulta = _resolver_hora_medico(doctor_id)

    # Validar que el médico no tenga ya una ficha para ese horario hoy
    if doctor_id and hora_consulta:
        _check_and_reserve_slot(doctor_id, hora_consulta)

    # Calcular número de ficha y turno al momento del registro
    num_ficha, turno_nombre = _calcular_num_ficha()

    visit = VisitRepository.create(
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
    )
    return VisitRepository.to_contract(visit)


def _calcular_num_ficha() -> tuple[int, str]:
    """
    Determina el número secuencial de ficha para el turno actual del día.
    Retorna (num_ficha, turno_nombre).
    Usa SELECT COUNT con el rango horario del turno → un solo query, O(1).
    """
    from datetime import date, datetime
    from django.utils import timezone
    from apps.recepcion.models import TurnoFichaConfig, Visit

    hora_actual = timezone.localtime(timezone.now()).time()
    turno = (
        TurnoFichaConfig.objects
        .filter(is_active=True, hora_inicio__lte=hora_actual, hora_fin__gt=hora_actual)
        .first()
    )

    if not turno:
        # Sin turno configurado: usar conteo total del día como fallback
        hoy = timezone.localtime(timezone.now()).date()
        inicio = timezone.make_aware(datetime.combine(hoy, datetime.min.time()))
        fin    = timezone.make_aware(datetime.combine(hoy, datetime.max.time()))
        count  = Visit.objects.filter(fch_alta__gte=inicio, fch_alta__lte=fin).count()
        return count + 1, ""

    hoy       = timezone.localtime(timezone.now()).date()
    inicio_dt = timezone.make_aware(datetime.combine(hoy, turno.hora_inicio))
    fin_dt    = timezone.make_aware(datetime.combine(hoy, turno.hora_fin))
    count     = Visit.objects.filter(fch_alta__gte=inicio_dt, fch_alta__lt=fin_dt).count()

    return count + 1, turno.nombre


def _resolver_hora_medico(doctor_id: int):
    """Obtiene la hora_inicio del horario activo del médico para hoy."""
    from datetime import date
    from django.db.models import Q
    try:
        from apps.medicos.models import RelMedicoConsultorio
        hoy     = date.today()
        dia_map = {0: "LUNES", 1: "MARTES", 2: "MIERCOLES", 3: "JUEVES",
                   4: "VIERNES", 5: "SABADO", 6: "DOMINGO"}
        dia     = dia_map[hoy.weekday()]
        rmc = (
            RelMedicoConsultorio.objects
            .prefetch_related("horarios")
            .filter(medico_id=doctor_id, is_active=True, fecha_inicio__lte=hoy)
            .filter(Q(fecha_fin__isnull=True) | Q(fecha_fin__gte=hoy))
            .first()
        )
        if not rmc:
            return None
        horario = rmc.horarios.filter(dia_semana=dia).first()
        return horario.hora_inicio if horario else None
    except Exception:
        return None


def list_visits(
    page: int,
    page_size: int,
    status_filter: str | None = None,
    date_filter=None,
    doctor_id: int | None = None,
    consultorio_id: int | None = None,
    centro_id: int | None = None,
    service_type: str | None = None,
    no_exp: str | None = None,
) -> dict:
    visits, total, total_pages, doctor_nombres = VisitRepository.list_paginated(
        page=page,
        page_size=page_size,
        status_filter=status_filter,
        date_filter=date_filter,
        doctor_id=doctor_id,
        consultorio_id=consultorio_id,
        centro_id=centro_id,
        service_type=service_type,
        no_exp=no_exp,
    )
    return {
        "items":      [VisitRepository.to_contract(v, doctor_nombres) for v in visits],
        "page":       page,
        "pageSize":   page_size,
        "total":      total,
        "totalPages": total_pages,
    }


def change_visit_status(visit_id: int, target_status: str) -> dict:
    visit = VisitRepository.get_by_id(visit_id)
    if not visit:
        raise VisitDomainError("VISIT_NOT_FOUND", "Visita no encontrada.", 404)

    next_state = transition_visit_state(visit.status, target_status, ROLE_RECEPCION)
    visit      = VisitRepository.update_status(visit, next_state)

    # Liberar el slot si la visita se cancela o marca como no-show
    if next_state in ("cancelada", "no_show") and visit.doctor_id and visit.hora_consulta:
        from django.utils import timezone
        hoy = timezone.localtime(timezone.now()).date()
        HorarioDisponible.objects.filter(
            medico_id=visit.doctor_id,
            fecha=hoy,
            hora=visit.hora_consulta,
            disponible=False,
        ).update(disponible=True)

    return VisitRepository.to_contract(visit)
