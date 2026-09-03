from django.db import models
from .base import CatalogBase


class MotivoCita(CatalogBase):
    class AplicaA(models.TextChoices):
        CANCELACION = "CANCELACION", "Cancelación"
        NO_ASISTIO  = "NO_ASISTIO",  "No asistió"
        AMBOS       = "AMBOS",       "Ambos"

    id = models.AutoField(primary_key=True, db_column="id_motivo_cita")
    name = models.CharField(max_length=100, db_column="motivo_cita")
    aplica_a = models.CharField(
        max_length=20,
        choices=AplicaA.choices,
        default=AplicaA.AMBOS,
        db_column="aplica_a",
    )

    class Meta:
        db_table = "cat_motivos_cita"
        managed = True
