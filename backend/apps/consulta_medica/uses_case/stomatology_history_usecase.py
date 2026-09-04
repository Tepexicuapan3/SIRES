from apps.consulta_medica.repositories.stomatology_history_repository import (
    StomatologyHistoryRepository,
)

from .consultation_usecase import ensure_doctor_role

# Serializer (camelCase) -> columna del modelo (snake_case).
STOMATOLOGY_HISTORY_FIELD_MAP = {
    "familyDiabetes": "family_diabetes",
    "familyCancer": "family_cancer",
    "familyHighBloodPressure": "family_high_blood_pressure",
    "familyLowBloodPressure": "family_low_blood_pressure",
    "causeOfDeath": "cause_of_death",
    "personalDiabetes": "personal_diabetes",
    "personalAsthma": "personal_asthma",
    "personalHighBloodPressure": "personal_high_blood_pressure",
    "personalLowBloodPressure": "personal_low_blood_pressure",
    "personalHepatitis": "personal_hepatitis",
    "personalHiv": "personal_hiv",
    "personalSmoking": "personal_smoking",
    "personalAlcoholism": "personal_alcoholism",
    "personalSubstanceAbuse": "personal_substance_abuse",
    "habits": "habits",
    "diet": "diet",
    "surgicalHistory": "surgical_history",
    "traumaticHistory": "traumatic_history",
    "allergyMedications": "allergy_medications",
    "allergyDentalMaterial": "allergy_dental_material",
    "allergyAnesthesia": "allergy_anesthesia",
    "allergyFood": "allergy_food",
    "allergyEnvironment": "allergy_environment",
    "allergyOther": "allergy_other",
    "currentIllnessHistory": "current_illness_history",
}


def get_stomatology_history(no_exp, pk_num, roles, permissions=None):
    ensure_doctor_role(roles, permissions)
    history, _ = StomatologyHistoryRepository.get_or_create_for_patient(no_exp, pk_num)
    return StomatologyHistoryRepository.to_contract(history)


def upsert_stomatology_history(no_exp, pk_num, roles, validated_data, actor_id, permissions=None):
    ensure_doctor_role(roles, permissions)

    history, _ = StomatologyHistoryRepository.get_or_create_for_patient(no_exp, pk_num)

    model_fields = {
        STOMATOLOGY_HISTORY_FIELD_MAP[key]: value
        for key, value in validated_data.items()
        if key in STOMATOLOGY_HISTORY_FIELD_MAP
    }

    history = StomatologyHistoryRepository.update(
        history,
        fields=model_fields,
        updated_by_id=actor_id,
    )
    return StomatologyHistoryRepository.to_contract(history)
