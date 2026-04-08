from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.catalogos.models import Consultorios


class ConsultoriosRepository:
    @staticmethod
    def get_all(*, search=None, est_activo=None, sort_by="no_consult", sort_order="asc"):
        queryset = Consultorios.objects.select_related("id_trno", "id_centro_atencion").all()

        if search:
            queryset = queryset.filter(
                Q(consult__icontains=search) | Q(no_consult__icontains=search)
            )

        if est_activo is not None:
            queryset = queryset.filter(est_activo=est_activo)

        allowed_sort_fields = {"no_consult", "consult", "est_activo", "id_consult"}
        order_field = sort_by if sort_by in allowed_sort_fields else "no_consult"
        if sort_order == "desc":
            order_field = f"-{order_field}"

        return queryset.order_by(order_field)

    @staticmethod
    def get_by_id(consultorio_id):
        return (
            Consultorios.objects.select_related("id_trno", "id_centro_atencion")
            .filter(id_consult=consultorio_id)
            .first()
        )

    @staticmethod
    @transaction.atomic
    def create(*, validated_data, actor_id=None):
        now = timezone.now()
        return Consultorios.objects.create(
            **validated_data,
            fch_alta=now,
            usr_alta=actor_id,
            fch_modf=now,
            usr_modf=actor_id,
        )

    @staticmethod
    @transaction.atomic
    def update(*, consultorio, validated_data, actor_id=None):
        for field, value in validated_data.items():
            setattr(consultorio, field, value)

        consultorio.fch_modf = timezone.now()
        consultorio.usr_modf = actor_id
        consultorio.save()
        return consultorio

    @staticmethod
    @transaction.atomic
    def delete(*, consultorio, actor_id=None):
        consultorio.est_activo = False
        consultorio.fch_baja = timezone.now()
        consultorio.usr_baja = actor_id
        consultorio.save(update_fields=["est_activo", "fch_baja", "usr_baja"])
        return consultorio
