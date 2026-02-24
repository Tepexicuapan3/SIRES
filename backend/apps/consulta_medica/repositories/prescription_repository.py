from apps.consulta_medica.models import VisitPrescription


class PrescriptionRepository:
    @staticmethod
    def upsert_for_visit(
        visit,
        *,
        items,
        created_by_id=None,
        updated_by_id=None,
    ):
        prescription, created = VisitPrescription.objects.update_or_create(
            id_visit=visit,
            defaults={
                "items": list(items),
                "is_active": True,
                "deleted_at": None,
                "deleted_by_id": None,
                "created_by_id": created_by_id,
                "updated_by_id": updated_by_id,
            },
        )
        return prescription, created

    @staticmethod
    def get_by_visit(visit):
        return VisitPrescription.objects.filter(id_visit=visit).first()

    @staticmethod
    def to_contract(prescription):
        return {
            "id": prescription.id_prescription,
            "visitId": prescription.id_visit_id,
            "items": list(prescription.items or []),
            "isActive": prescription.is_active,
            "createdAt": prescription.created_at,
            "updatedAt": prescription.updated_at,
        }
