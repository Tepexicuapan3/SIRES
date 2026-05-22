"""
Servicio de turnos de fichas.

Responsabilidades:
- Determinar en qué turno se está generando una ficha.
- Calcular el número secuencial de ficha dentro del turno del día.
- Verificar si el turno ya alcanzó su límite de fichas.
"""

from datetime import date, datetime
from django.utils import timezone


def get_turno_actual():
    """
    Devuelve el TurnoFichaConfig activo para la hora actual.
    Retorna None si no hay turno configurado en este momento.
    """
    from apps.recepcion.models import TurnoFichaConfig

    hora_actual = timezone.localtime(timezone.now()).time()

    return (
        TurnoFichaConfig.objects
        .filter(is_active=True)
        .filter(hora_inicio__lte=hora_actual, hora_fin__gt=hora_actual)
        .first()
    )


def get_num_ficha_turno(visit) -> dict:
    """
    Calcula el número de ficha secuencial del turno actual del día.

    Retorna:
        {
            "num_ficha":   int,          # número dentro del turno (1-based)
            "turno":       str,          # nombre del turno (ej. "Matutino")
            "max_fichas":  int,          # límite configurado
            "agotado":     bool,         # True si se superó el límite
        }

    Si no hay turno configurado, usa el id_visit como fallback.
    """
    from apps.recepcion.models import Visit

    turno = get_turno_actual()

    if not turno:
        # Sin turno configurado: usar id_visit como número
        return {
            "num_ficha":  visit.id_visit,
            "turno":      "",
            "max_fichas": 0,
            "agotado":    False,
        }

    # Contar visitas del día dentro del rango horario del turno
    hoy = timezone.localtime(visit.fch_alta).date() if visit.fch_alta else date.today()

    inicio_dt = timezone.make_aware(
        datetime.combine(hoy, turno.hora_inicio)
    )
    fin_dt = timezone.make_aware(
        datetime.combine(hoy, turno.hora_fin)
    )

    count = (
        Visit.objects
        .filter(fch_alta__gte=inicio_dt, fch_alta__lt=fin_dt)
        .count()
    )

    # La visita actual YA está en la BD, así que count incluye la visita actual
    num_ficha = count

    return {
        "num_ficha":  num_ficha,
        "turno":      turno.nombre,
        "max_fichas": turno.max_fichas,
        "agotado":    num_ficha > turno.max_fichas,
    }
