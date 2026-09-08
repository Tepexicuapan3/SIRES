from apps.consulta_medica.models import VisitDiagnosis


class VisitDiagnosisRepository:
    @staticmethod
    def get_by_id(diagnosis_id):
        return VisitDiagnosis.objects.filter(pk=diagnosis_id, is_active=True).first()

    @staticmethod
    def get_active_by_consultation_and_cie(consultation, cie):
        return VisitDiagnosis.objects.filter(
            consultation=consultation,
            cie=cie,
            status=VisitDiagnosis.Status.ACTIVO,
            is_active=True,
        ).first()

    @staticmethod
    def create(*, consultation, cie, notes=None, created_by_id=None, updated_by_id=None):
        return VisitDiagnosis.objects.create(
            consultation=consultation,
            cie=cie,
            notes=notes,
            created_by_id=created_by_id,
            updated_by_id=updated_by_id,
        )

    @staticmethod
    def cancel(diagnosis, *, updated_by_id=None):
        diagnosis.status = VisitDiagnosis.Status.CANCELADO
        diagnosis.updated_by_id = updated_by_id
        diagnosis.save(update_fields=["status", "updated_by_id", "updated_at"])
        return diagnosis

    @staticmethod
    def list_for_consultation(consultation):
        return (
            VisitDiagnosis.objects.filter(
                consultation=consultation, status=VisitDiagnosis.Status.ACTIVO, is_active=True,
            )
            .select_related("cie")
            .order_by("created_at")
        )

    @staticmethod
    def to_contract(diagnosis):
        return {
            "id": diagnosis.id_visit_diagnosis,
            "visitId": diagnosis.consultation.id_visit_id,
            "cieCode": diagnosis.cie_id,
            "cieDescription": diagnosis.cie.description,
            "notes": diagnosis.notes,
            "status": diagnosis.status,
            "createdAt": diagnosis.created_at,
        }
