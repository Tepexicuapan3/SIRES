from apps.catalogos.models import Medicamentos
from apps.consulta_medica.repositories.consultation_repository import ConsultationRepository
from apps.consulta_medica.repositories.prescription_item_repository import (
    PrescriptionItemRepository,
)
from apps.consulta_medica.repositories.prescription_repository import PrescriptionRepository
from apps.recepcion.repositories.visit_repository import VisitRepository
from apps.recepcion.services.errors import VisitDomainError

from .consultation_usecase import ensure_doctor_role


def _get_visit_or_error(visit_id):
    visit = VisitRepository.get_by_id(visit_id)
    if not visit:
        raise VisitDomainError("VISIT_NOT_FOUND", "Visita no encontrada.", 404)
    return visit


def _get_consultation_or_error(visit):
    consultation = ConsultationRepository.get_by_visit(visit)
    if consultation is None:
        raise VisitDomainError(
            "CONSULTATION_NOT_FOUND",
            "Primero debes guardar el diagnostico de esta consulta.",
            409,
        )
    return consultation


def add_prescription_item(
    visit_id,
    roles,
    *,
    medication_id,
    quantity,
    indications,
    dose=None,
    actor_id,
    permissions=None,
):
    """
    Agrega un item de receta estructurado (medicamento del catalogo +
    indicaciones + cantidad) -- complementa a save_prescriptions (texto
    libre). Equivalente moderno de det_receta del legado.
    """
    ensure_doctor_role(roles, permissions)

    visit = _get_visit_or_error(visit_id)
    _get_consultation_or_error(visit)

    medication = Medicamentos.objects.filter(pk=medication_id, is_active=True).first()
    if medication is None:
        raise VisitDomainError(
            "VALIDATION_ERROR",
            "Hay errores en el formulario",
            422,
            details={"medicationId": ["El medicamento no existe o no esta activo."]},
        )

    if medication.max_quantity and quantity > medication.max_quantity:
        raise VisitDomainError(
            "VALIDATION_ERROR",
            "Hay errores en el formulario",
            422,
            details={
                "quantity": [
                    f"Maximo {medication.max_quantity} unidades para este medicamento."
                ]
            },
        )

    prescription = PrescriptionRepository.get_or_create_for_visit(
        visit, created_by_id=actor_id, updated_by_id=actor_id,
    )

    if PrescriptionItemRepository.get_active_by_prescription_and_medication(
        prescription, medication,
    ):
        raise VisitDomainError(
            "PRESCRIPTION_ITEM_ALREADY_EXISTS",
            "Ese medicamento ya esta agregado en la receta de esta consulta.",
            409,
        )

    normalized_indications = (indications or "").strip()
    if not normalized_indications:
        raise VisitDomainError(
            "VALIDATION_ERROR",
            "Hay errores en el formulario",
            422,
            details={"indications": ["Las indicaciones son obligatorias."]},
        )

    item = PrescriptionItemRepository.create(
        prescription=prescription,
        medication=medication,
        indications=normalized_indications,
        quantity=quantity,
        dose=(dose or "").strip() or None,
        created_by_id=actor_id,
        updated_by_id=actor_id,
    )
    return PrescriptionItemRepository.to_contract(item)


def cancel_prescription_item(visit_id, item_id, roles, *, actor_id, permissions=None):
    ensure_doctor_role(roles, permissions)

    visit = _get_visit_or_error(visit_id)
    prescription = PrescriptionRepository.get_by_visit(visit)
    if prescription is None:
        raise VisitDomainError(
            "PRESCRIPTION_ITEM_NOT_FOUND", "Item de receta no encontrado.", 404,
        )

    item = PrescriptionItemRepository.get_by_id(item_id)
    if item is None or item.prescription_id != prescription.id_prescription:
        raise VisitDomainError(
            "PRESCRIPTION_ITEM_NOT_FOUND", "Item de receta no encontrado.", 404,
        )

    item = PrescriptionItemRepository.cancel(item, updated_by_id=actor_id)
    return PrescriptionItemRepository.to_contract(item)


def get_prescription_items(visit_id, roles, permissions=None):
    ensure_doctor_role(roles, permissions)

    visit = _get_visit_or_error(visit_id)
    prescription = PrescriptionRepository.get_by_visit(visit)
    if prescription is None:
        return {"items": [], "total": 0}

    items = PrescriptionItemRepository.list_for_prescription(prescription)
    contracts = [PrescriptionItemRepository.to_contract(item) for item in items]
    return {"items": contracts, "total": len(contracts)}
