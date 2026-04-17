from django.db import transaction
from django.db.models import QuerySet

from ..models import CatCentroAtencion, CatCentroAtencionHorario
from ..repositories.centro_atencion_repository import CentroAtencionRepository


class CentroAtencionUseCase:

    @staticmethod
    def list_centers(
        center_type: str | None = None,
        search: str | None = None,
        is_active: bool | None = None,
    ) -> QuerySet[CatCentroAtencion]:
        return CentroAtencionRepository.get_filtered(
            center_type=center_type,
            search=search,
            is_active=is_active,
        )

    @staticmethod
    @transaction.atomic
    def create_center_with_schedules(validated_data: dict) -> CatCentroAtencion:
        schedules_data: list[dict] = validated_data.pop("schedules", [])

        center = CatCentroAtencion(**validated_data)
        center.full_clean()
        center.save()

        CentroAtencionUseCase._create_schedules(center, schedules_data)

        return center

    @staticmethod
    @transaction.atomic
    def update_center_with_schedules(
        instance: CatCentroAtencion,
        validated_data: dict,
    ) -> CatCentroAtencion:
        schedules_data: list[dict] | None = validated_data.pop("schedules", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.full_clean()
        instance.save()

        if schedules_data is not None:
            instance.schedules.all().delete()
            CentroAtencionUseCase._create_schedules(instance, schedules_data)

        return instance

    # ------------------------------------------------------------------ #
    # Helpers privados                                                     #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _create_schedules(
        center: CatCentroAtencion,
        schedules_data: list[dict],
    ) -> None:
        """Valida y crea los horarios en un solo query."""
        schedules = [
            CatCentroAtencionHorario(center=center, **data)
            for data in schedules_data
        ]

        # Valida cada horario antes de insertar (ejecuta el clean() del modelo)
        for schedule in schedules:
            schedule.full_clean()

        CatCentroAtencionHorario.objects.bulk_create(schedules)