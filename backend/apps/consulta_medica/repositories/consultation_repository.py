from apps.consulta_medica.models import VisitConsultation


class ConsultationRepository:
    @staticmethod
    def get_by_visit(visit):
        return VisitConsultation.objects.filter(id_visit=visit).first()

    @staticmethod
    def upsert_for_visit(
        visit,
        *,
        doctor_id,
        primary_diagnosis,
        final_note,
        created_by_id=None,
        updated_by_id=None,
    ):
        consultation, created = VisitConsultation.objects.update_or_create(
            id_visit=visit,
            defaults={
                "doctor_id": doctor_id,
                "primary_diagnosis": primary_diagnosis,
                "final_note": final_note,
                "is_active": True,
                "deleted_at": None,
                "deleted_by_id": None,
                "created_by_id": created_by_id,
                "updated_by_id": updated_by_id,
            },
        )
        return consultation, created

    @staticmethod
    def to_contract(consultation):
        return {
            "id": consultation.id_consultation,
            "visitId": consultation.id_visit_id,
            "doctorId": consultation.doctor_id,
            "primaryDiagnosis": consultation.primary_diagnosis,
            "finalNote": consultation.final_note,
            "isActive": consultation.is_active,
            "createdAt": consultation.created_at,
            "updatedAt": consultation.updated_at,
        }
