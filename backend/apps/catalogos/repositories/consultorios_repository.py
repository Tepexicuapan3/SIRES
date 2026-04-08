from django.db import transaction
from django.db.models import CharField, Q
from django.db.models.functions import Cast
from django.utils import timezone

from apps.catalogos.models import Consultorios


class ConsultoriosRepository:
    @staticmethod
    def get_all(*, search=None, est_activo=None, sort_by="code", sort_order="asc"):
        queryset = Consultorios.objects.select_related("id_turn", "id_center").all()

        if search:
            queryset = queryset.annotate(
                code_text=Cast("code", output_field=CharField())
            )
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(code_text__icontains=search)
            )

        if est_activo is not None:
            queryset = queryset.filter(is_active=est_activo)

        allowed_sort_fields = {
            "id": "id",
            "name": "name",
            "code": "code",
            "isActive": "is_active",
            "is_active": "is_active",
        }
        order_field = allowed_sort_fields.get(sort_by, "code")
        if sort_order == "desc":
            order_field = f"-{order_field}"

        return queryset.order_by(order_field)

    @staticmethod
    def get_by_id(consultorio_id):
        return (
            Consultorios.objects.select_related("id_turn", "id_center")
            .filter(id=consultorio_id)
            .first()
        )

    @staticmethod
    @transaction.atomic
    def create(*, validated_data, actor_id=None):
        now = timezone.now()
        return Consultorios.objects.create(
            **validated_data,
            created_at=now,
            created_by_id=actor_id,
            updated_at=now,
            updated_by_id=actor_id,
        )

    @staticmethod
    @transaction.atomic
    def update(*, consultorio, validated_data, actor_id=None):
        for field, value in validated_data.items():
            setattr(consultorio, field, value)

        consultorio.updated_at = timezone.now()
        consultorio.updated_by_id = actor_id
        consultorio.save()
        return consultorio

    @staticmethod
    @transaction.atomic
    def delete(*, consultorio, actor_id=None):
        consultorio.is_active = False
        consultorio.deleted_at = timezone.now()
        consultorio.deleted_by_id = actor_id
        consultorio.save(update_fields=["is_active", "deleted_at", "deleted_by_id"])
        return consultorio
