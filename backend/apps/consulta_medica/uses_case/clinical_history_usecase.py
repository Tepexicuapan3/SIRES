from apps.consulta_medica.repositories.clinical_history_repository import ClinicalHistoryRepository

from .consultation_usecase import ensure_doctor_role

# Serializer (camelCase) -> columna del modelo (snake_case).
CLINICAL_HISTORY_FIELD_MAP = {
    "occupationId": "occupation_id",
    "educationLevelId": "education_level_id",
    "maritalStatusId": "marital_status_id",
    "religionId": "religion_id",
    "residenceTypeId": "residence_type_id",
    "phone": "phone",
    "familyHistory": "family_history",
    "currentIllness": "current_illness",
    "systemsReview": "systems_review",
    "headExam": "head_exam",
    "neckExam": "neck_exam",
    "chestExam": "chest_exam",
    "abdomenExam": "abdomen_exam",
    "genitalsExam": "genitals_exam",
    "limbsExam": "limbs_exam",
    "diagnosticManagement": "diagnostic_management",
    "therapeuticManagement": "therapeutic_management",
    "allergies": "allergies",
}


def get_clinical_history(no_exp, pk_num, roles, permissions=None):
    ensure_doctor_role(roles, permissions)
    history, _ = ClinicalHistoryRepository.get_or_create_for_patient(no_exp, pk_num)
    return ClinicalHistoryRepository.to_contract(history)


def upsert_clinical_history(no_exp, pk_num, roles, validated_data, actor_id, permissions=None):
    ensure_doctor_role(roles, permissions)

    history, _ = ClinicalHistoryRepository.get_or_create_for_patient(no_exp, pk_num)

    model_fields = {
        CLINICAL_HISTORY_FIELD_MAP[key]: value
        for key, value in validated_data.items()
        if key in CLINICAL_HISTORY_FIELD_MAP
    }

    history = ClinicalHistoryRepository.update(
        history,
        fields=model_fields,
        updated_by_id=actor_id,
    )
    return ClinicalHistoryRepository.to_contract(history)
