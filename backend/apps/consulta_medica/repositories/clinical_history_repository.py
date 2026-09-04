from apps.consulta_medica.models import ClinicalHistory


class ClinicalHistoryRepository:
    @staticmethod
    def get_or_create_for_patient(no_exp, pk_num):
        history, created = ClinicalHistory.objects.get_or_create(
            no_exp=no_exp,
            pk_num=pk_num,
        )
        return history, created

    @staticmethod
    def update(history, *, fields, updated_by_id=None):
        for field_name, value in fields.items():
            setattr(history, field_name, value)
        history.updated_by_id = updated_by_id
        history.save()
        return history

    @staticmethod
    def to_contract(history):
        return {
            "id": history.id_clinical_history,
            "noExp": history.no_exp,
            "pkNum": history.pk_num,
            "occupationId": history.occupation_id,
            "educationLevelId": history.education_level_id,
            "maritalStatusId": history.marital_status_id,
            "religionId": history.religion_id,
            "residenceTypeId": history.residence_type_id,
            "phone": history.phone,
            "familyHistory": history.family_history,
            "currentIllness": history.current_illness,
            "systemsReview": history.systems_review,
            "headExam": history.head_exam,
            "neckExam": history.neck_exam,
            "chestExam": history.chest_exam,
            "abdomenExam": history.abdomen_exam,
            "genitalsExam": history.genitals_exam,
            "limbsExam": history.limbs_exam,
            "diagnosticManagement": history.diagnostic_management,
            "therapeuticManagement": history.therapeutic_management,
            "allergies": history.allergies,
            "isActive": history.is_active,
            "createdAt": history.created_at,
            "updatedAt": history.updated_at,
        }
