from apps.consulta_medica.models import OdontogramTooth
from apps.consulta_medica.odontogram_constants import (
    ALL_TEETH_FDI,
    DECIDUOUS_TEETH_FDI,
    PERMANENT_TEETH_FDI,
)
from apps.consulta_medica.repositories.odontogram_repository import OdontogramRepository
from apps.recepcion.services.errors import VisitDomainError

from .consultation_usecase import ensure_doctor_role

_DENTITION_SETS = {
    "permanent": PERMANENT_TEETH_FDI,
    "deciduous": DECIDUOUS_TEETH_FDI,
    "all": ALL_TEETH_FDI,
}


def get_patient_odontogram(no_exp, pk_num, roles, permissions=None, *, dentition="permanent"):
    ensure_doctor_role(roles, permissions)

    tooth_fdi_list = _DENTITION_SETS.get(dentition)
    if tooth_fdi_list is None:
        raise VisitDomainError(
            "VALIDATION_ERROR",
            "Hay errores en el formulario",
            422,
            details={"dentition": ["Debe ser 'permanent', 'deciduous' o 'all'."]},
        )

    existing_by_fdi = OdontogramRepository.list_for_patient(no_exp, pk_num)

    items = []
    for tooth_fdi in tooth_fdi_list:
        tooth = existing_by_fdi.get(tooth_fdi)
        if tooth is not None:
            items.append(OdontogramRepository.to_contract(tooth))
        else:
            items.append({
                "toothFdi": tooth_fdi,
                "condition": OdontogramTooth.Condition.HEALTHY,
                "notes": None,
                "updatedAt": None,
            })

    return {"items": items}


def upsert_tooth_condition(
    no_exp,
    pk_num,
    tooth_fdi,
    roles,
    *,
    condition,
    notes,
    actor_id,
    permissions=None,
):
    ensure_doctor_role(roles, permissions)

    if tooth_fdi not in ALL_TEETH_FDI:
        raise VisitDomainError(
            "VALIDATION_ERROR",
            "Hay errores en el formulario",
            422,
            details={"toothFdi": ["Numero de pieza FDI invalido."]},
        )

    if condition not in OdontogramTooth.Condition.values:
        raise VisitDomainError(
            "VALIDATION_ERROR",
            "Hay errores en el formulario",
            422,
            details={"condition": ["Condicion invalida."]},
        )

    tooth = OdontogramRepository.upsert_tooth(
        no_exp=no_exp,
        pk_num=pk_num,
        tooth_fdi=tooth_fdi,
        condition=condition,
        notes=notes,
        updated_by_id=actor_id,
    )
    return OdontogramRepository.to_contract(tooth)
