"""
Cascada de resolución de la hora de consulta, compartida por la generación
de la ficha de consulta (`ficha_service.py`) y el contrato de visitas
expuesto a recepción (`visit_repository.py`).

Se extrajo a un módulo propio para que ambos consumidores reutilicen la
misma lógica sin depender uno del otro (repositorio vs. servicio de PDF).
"""

from datetime import datetime, time


def resolve_hora_consulta(
    hora_explicita: time | None,
    cita_dt: datetime | None,
    fch_alta: datetime | None,
) -> str:
    """
    Resuelve la hora de consulta a mostrar, en orden de prioridad:

    1. Hora explícita capturada en el check-in manual/walk-in
       (`visit.hora_consulta`).
    2. Hora de la cita médica vinculada (agendada desde el portal en línea
       o reservada por recepción).
    3. Fallback: hora de alta del check-in (`visit.fch_alta`).

    `cita_dt` y `fch_alta` deben venir ya convertidos a hora local
    (ver `django.utils.timezone.localtime`); esta función no hace
    conversión de zona horaria.

    Retorna cadena vacía si ninguno de los tres niveles tiene dato.
    """
    if hora_explicita:
        return hora_explicita.strftime("%H:%M")
    if cita_dt:
        return cita_dt.strftime("%H:%M")
    if fch_alta:
        return fch_alta.strftime("%H:%M")
    return ""
