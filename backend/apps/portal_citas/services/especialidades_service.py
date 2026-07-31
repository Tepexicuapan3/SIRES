"""
apps/portal_citas/services/especialidades_service.py
===============================================
Catálogo de especialidades para el selector del portal de autoservicio
(Fase 3 — patch).

Reutiliza el catálogo real ya existente y conectado a los médicos
(``apps.catalogos.models.Especialidades`` + ``apps.medicos.models.RelMedicoEspecialidad``)
en vez del campo ``servicio_tipo`` (que solo existe en ``CitaMedica`` y no
sirve para filtrar horarios/médicos — ver nota en ``slots_service``).

Es un catálogo de solo lectura: no expone nada sensible, solo
``{especialidadId, nombre}``.
"""

from apps.catalogos.models import Especialidades


def listar_especialidades() -> list[dict]:
    especialidades = (
        Especialidades.objects
        .filter(is_active=True)
        .order_by("name")
    )
    return [
        {"especialidadId": e.id, "nombre": e.name}
        for e in especialidades
    ]
