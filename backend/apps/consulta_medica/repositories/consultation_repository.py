from apps.consulta_medica.models import VisitConsultation, VisitConsultationRevision


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
        cie_code,
        final_note,
        created_by_id=None,
        updated_by_id=None,
    ):
        existing = VisitConsultation.objects.filter(id_visit=visit).first()
        if existing is not None and (
            existing.primary_diagnosis != primary_diagnosis
            or existing.cie_id != cie_code
            or existing.final_note != final_note
        ):
            # Versionado real (NOM-024): se guarda un snapshot del valor
            # anterior ANTES de pisarlo -- nunca se sobrescribe sin dejar
            # rastro, a diferencia del legado (concatenacion de texto en un
            # solo campo TEXT).
            VisitConsultationRevision.objects.create(
                consultation=existing,
                previous_primary_diagnosis=existing.primary_diagnosis,
                previous_cie_id=existing.cie_id,
                previous_final_note=existing.final_note,
                changed_by_id=updated_by_id,
            )

        consultation, created = VisitConsultation.objects.update_or_create(
            id_visit=visit,
            defaults={
                "doctor_id": doctor_id,
                "primary_diagnosis": primary_diagnosis,
                "cie_id": cie_code,
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
            "cieCode": consultation.cie_id,
            "finalNote": consultation.final_note,
            "isActive": consultation.is_active,
            "createdAt": consultation.created_at,
            "updatedAt": consultation.updated_at,
        }
