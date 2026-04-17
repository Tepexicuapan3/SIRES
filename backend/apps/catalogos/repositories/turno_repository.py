from django.db.models import QuerySet

from ..models import Turnos


class TurnoRepository:

    @staticmethod
    def get_all() -> QuerySet[Turnos]:
        return Turnos.objects.filter(is_active=True)

    @staticmethod
    def get_by_id(turn_id: int) -> Turnos:
        """Lanza Turnos.DoesNotExist si no existe."""
        return Turnos.objects.get(pk=turn_id)