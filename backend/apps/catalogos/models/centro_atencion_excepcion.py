from django.core.exceptions import ValidationError
from django.db import models

from .base import CatalogBase
from .centros_atencion import CatCentroAtencion


class CatCentroAtencionExcepcion(CatalogBase):

    TIPO_CERRADO = "CERRADO"
    TIPO_HORARIO_MODIFICADO = "HORARIO_MODIFICADO"
    TIPO_AVISO = "AVISO"

    TIPO_CHOICES = [
        (TIPO_CERRADO, "Cerrado"),
        (TIPO_HORARIO_MODIFICADO, "Horario modificado"),
        (TIPO_AVISO, "Aviso"),
    ]

    id = models.BigAutoField(primary_key=True, db_column="id_excepcion")
    center = models.ForeignKey(
        CatCentroAtencion,
        on_delete=models.DO_NOTHING,
        db_column="id_centro_atencion",
        related_name="excepciones",
    )
    date = models.DateField(db_column="fecha")
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, db_column="tipo")
    reason = models.CharField(max_length=255, db_column="motivo")
    opening_time = models.TimeField(null=True, blank=True, db_column="hora_apertura")
    closing_time = models.TimeField(null=True, blank=True, db_column="hora_cierre")

    class Meta:
        db_table = "cat_centros_atencion_excepciones"
        managed = True
        ordering = ["date"]
        unique_together = [("center", "date")]
        verbose_name = "Excepción de Centro de Atención"
        verbose_name_plural = "Excepciones de Centros de Atención"

    def clean(self):
        if self.tipo == self.TIPO_HORARIO_MODIFICADO:
            if not self.opening_time or not self.closing_time:
                raise ValidationError(
                    "El tipo Horario modificado requiere hora de apertura y hora de cierre."
                )
            if self.opening_time >= self.closing_time:
                raise ValidationError(
                    "La hora de apertura debe ser anterior a la hora de cierre."
                )
        else:
            if self.opening_time or self.closing_time:
                raise ValidationError(
                    f"El tipo {self.get_tipo_display()} no debe tener horas de apertura ni cierre."
                )

    def __str__(self) -> str:
        return f"{self.center.name} — {self.date} — {self.get_tipo_display()}"
