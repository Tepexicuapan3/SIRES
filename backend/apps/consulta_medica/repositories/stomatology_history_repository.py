from apps.consulta_medica.models import StomatologyHistory


class StomatologyHistoryRepository:
    @staticmethod
    def get_or_create_for_patient(no_exp, pk_num):
        history, created = StomatologyHistory.objects.get_or_create(
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
            "id": history.id_stomatology_history,
            "noExp": history.no_exp,
            "pkNum": history.pk_num,
            "familyDiabetes": history.family_diabetes,
            "familyCancer": history.family_cancer,
            "familyHighBloodPressure": history.family_high_blood_pressure,
            "familyLowBloodPressure": history.family_low_blood_pressure,
            "causeOfDeath": history.cause_of_death,
            "personalDiabetes": history.personal_diabetes,
            "personalAsthma": history.personal_asthma,
            "personalHighBloodPressure": history.personal_high_blood_pressure,
            "personalLowBloodPressure": history.personal_low_blood_pressure,
            "personalHepatitis": history.personal_hepatitis,
            "personalHiv": history.personal_hiv,
            "personalSmoking": history.personal_smoking,
            "personalAlcoholism": history.personal_alcoholism,
            "personalSubstanceAbuse": history.personal_substance_abuse,
            "habits": history.habits,
            "diet": history.diet,
            "surgicalHistory": history.surgical_history,
            "traumaticHistory": history.traumatic_history,
            "allergyMedications": history.allergy_medications,
            "allergyDentalMaterial": history.allergy_dental_material,
            "allergyAnesthesia": history.allergy_anesthesia,
            "allergyFood": history.allergy_food,
            "allergyEnvironment": history.allergy_environment,
            "allergyOther": history.allergy_other,
            "currentIllnessHistory": history.current_illness_history,
            "isActive": history.is_active,
            "createdAt": history.created_at,
            "updatedAt": history.updated_at,
        }
