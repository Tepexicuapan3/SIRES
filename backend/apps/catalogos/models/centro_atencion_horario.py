from django.core.exceptions import ValidationError
from django.db import models

from .base import CatalogBase
from .centros_atencion import CatCentroAtencion
from .turnos import Turnos


class CatCentroAtencionHorario(CatalogBase):

    class DiaSemana(models.IntegerChoices):
        LUNES     = 1, "Lunes"
        MARTES    = 2, "Martes"
        MIERCOLES = 3, "Miércoles"
        JUEVES    = 4, "Jueves"
        VIERNES   = 5, "Viernes"
        SABADO    = 6, "Sábado"
        DOMINGO   = 7, "Domingo"

    id = models.BigAutoField(primary_key=True, db_column="id_horario")
    center = models.ForeignKey(
        CatCentroAtencion,
        on_delete=models.DO_NOTHING,
        db_column="id_centro_atencion",
        related_name="schedules",
    )
    shift = models.ForeignKey(
        Turnos,
        on_delete=models.DO_NOTHING,
        db_column="id_turno",
        related_name="center_schedules",
    )
    week_day     = models.SmallIntegerField(
        db_column="dia_semana",
        choices=DiaSemana.choices,
        db_index=True,
    )
    is_open      = models.BooleanField(default=True,  db_column="abierto")
    is_24_hours  = models.BooleanField(default=False, db_column="es_24_horas")
    opening_time = models.TimeField(null=True, blank=True, db_column="hora_apertura")
    closing_time = models.TimeField(null=True, blank=True, db_column="hora_cierre")
    observations = models.CharField(max_length=255, null=True, blank=True, db_column="observaciones")

    class Meta:
        db_table    = "cat_centros_atencion_horarios"
        managed     = False
        ordering    = ["center", "week_day", "shift"]
        unique_together = (("center", "shift", "week_day"),)
        verbose_name        = "Horario de Centro de Atención"
        verbose_name_plural = "Horarios de Centros de Atención"

    def clean(self):
        # Centro cerrado: no deben existir horarios definidos
        if not self.is_open:
            if self.opening_time or self.closing_time:
                raise ValidationError(
                    "Un centro marcado como cerrado no debe tener horarios de apertura/cierre."
                )

        # 24 horas: los horarios específicos no aplican
        if self.is_24_hours:
            if self.opening_time or self.closing_time:
                raise ValidationError(
                    "Un centro de 24 horas no debe tener horarios de apertura/cierre definidos."
                )

        # Centro abierto y no 24h: ambos horarios son obligatorios
        if self.is_open and not self.is_24_hours:
            if not self.opening_time or not self.closing_time:
                raise ValidationError(
                    "Se requieren hora de apertura y cierre cuando el centro está abierto y no es 24 horas."
                )
            if self.opening_time >= self.closing_time:
                raise ValidationError(
                    "La hora de apertura debe ser anterior a la hora de cierre."
                )

    def __str__(self) -> str:
        return f"{self.center.name} — {self.get_week_day_display()} — {self.shift.name}"