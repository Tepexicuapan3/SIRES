import math

from apps.recepcion.models import Visit


class VisitRepository:
    @staticmethod
    def create(patient_id, has_appointment):
        return Visit.objects.create(
            patient_id=patient_id,
            has_appointment=has_appointment,
            status="en_espera",
        )

    @staticmethod
    def get_by_id(visit_id):
        return Visit.objects.filter(id_visit=visit_id).first()

    @staticmethod
    def update_status(visit, status_value):
        visit.status = status_value
        visit.save(update_fields=["status", "fch_modf"])
        return visit

    @staticmethod
    def list_paginated(page, page_size):
        queryset = Visit.objects.order_by("id_visit")
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
            "patientId": visit.patient_id,
            "hasAppointment": visit.has_appointment,
            "status": visit.status,
        }
