from django.db.models import Q, QuerySet

from ..models import CatCentroAtencion


class CentroAtencionRepository:

    @staticmethod
    def get_by_id(center_id: int) -> CatCentroAtencion:
        """Lanza CatCentroAtencion.DoesNotExist si no existe."""
        return CatCentroAtencion.objects.get(pk=center_id)

    @staticmethod
    def get_filtered(
        center_type: str | None = None,
        search: str | None = None,
        is_active: bool | None = None,
    ) -> QuerySet[CatCentroAtencion]:
        """
        Filtros opcionales combinables:
        - center_type : valor de TipoCentro (ej. "CLINICA")
        - search      : búsqueda parcial en nombre o CLUES
        - is_active   : filtra por estado activo/inactivo
        """
        qs = CatCentroAtencion.objects.all()

        if center_type:
            qs = qs.filter(center_type=center_type)

        if search:
            qs = qs.filter(
                Q(name__icontains=search) | Q(code__icontains=search)
            )

        if is_active is not None:
            qs = qs.filter(is_active=is_active)

        return qs