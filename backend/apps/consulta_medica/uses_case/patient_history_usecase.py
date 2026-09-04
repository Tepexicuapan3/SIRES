from apps.consulta_medica.repositories.consultation_repository import ConsultationRepository
from apps.consulta_medica.repositories.prescription_repository import PrescriptionRepository

from .consultation_usecase import ensure_doctor_role


def _doctor_name(doctor):
    if doctor is None:
        return None
    detalle = getattr(doctor, "detalle", None)
    return detalle.nombre_completo if detalle else None


def _consultation_to_history_item(consultation):
    visit = consultation.id_visit
    prescription = PrescriptionRepository.get_by_visit(visit)

    return {
        "visitId": visit.id_visit,
        "date": visit.fecha_consulta,
        "doctorId": consultation.doctor_id,
        "doctorName": _doctor_name(consultation.doctor),
        "serviceType": visit.service_type,
        "primaryDiagnosis": consultation.primary_diagnosis,
        "cieCode": consultation.cie_id,
        "cieDescription": consultation.cie.description if consultation.cie else None,
        "finalNote": consultation.final_note,
        "prescriptionItems": list(prescription.items or []) if prescription else [],
    }


def get_patient_consultations_history(no_exp, pk_num, roles, permissions=None):
    ensure_doctor_role(roles, permissions)

    consultations = ConsultationRepository.list_for_patient(no_exp, pk_num)
    items = [_consultation_to_history_item(c) for c in consultations]

    return {
        "items": items,
        "total": len(items),
    }
