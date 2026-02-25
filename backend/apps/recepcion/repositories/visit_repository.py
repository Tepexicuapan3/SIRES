import math
import uuid

from apps.recepcion.models import Visit


class VisitRepository:
    @staticmethod
    def create(
        patient_id,
        arrival_type,
        service_type=Visit.ServiceType.MEDICINA_GENERAL,
        appointment_id=None,
        doctor_id=None,
        notes=None,
    ):
        return Visit.objects.create(
            folio=VisitRepository._build_folio(),
            patient_id=patient_id,
            arrival_type=arrival_type,
            service_type=service_type,
            appointment_id=appointment_id,
            doctor_id=doctor_id,
            notes=notes,
            status="en_espera",
        )

    @staticmethod
    def get_by_id(visit_id):
        return Visit.objects.filter(id_visit=visit_id).first()

    @staticmethod
    def exists_open_visit_for_patient(patient_id):
        return Visit.objects.filter(
            patient_id=patient_id,
            fch_baja__isnull=True,
            status__in=("en_espera", "en_somatometria", "lista_para_doctor", "en_consulta"),
        ).exists()

    @staticmethod
    def update_status(visit, status_value):
        visit.status = status_value
        visit.save(update_fields=["status", "fch_modf"])
        return visit

    @staticmethod
    def list_paginated(
        page,
        page_size,
        status_filter=None,
        date_filter=None,
        doctor_id=None,
        service_type=None,
    ):
        queryset = Visit.objects.order_by("-id_visit")

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if date_filter:
            queryset = queryset.filter(fch_alta__date=date_filter)
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        if service_type:
            queryset = queryset.filter(service_type=service_type)

        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        visits = list(queryset[start:end])

        total_pages = math.ceil(total / page_size) if total else 0
        return visits, total, total_pages

    @staticmethod
    def to_contract(visit):
        return {
            "id": visit.id_visit,
            "folio": visit.folio,
            "patientId": visit.patient_id,
            "arrivalType": visit.arrival_type,
            "serviceType": visit.service_type,
            "appointmentId": visit.appointment_id,
            "doctorId": visit.doctor_id,
            "notes": visit.notes,
            "status": visit.status,
        }

    @staticmethod
    def _build_folio():
        return f"VIS-{uuid.uuid4().hex[:12].upper()}"
