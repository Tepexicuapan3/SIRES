from django.db import models
from .base import CatalogBase


class Medicamentos(CatalogBase):
    """
    Catalogo de medicamentos individuales -- equivalente moderno de
    cat_medicamentos del legado (clave, nombre comercial/generico,
    presentacion, cuadro basico S/E/I, control de repeticion por no_caja).
    """

    class CuadroBasico(models.TextChoices):
        BASICO = "BASICO", "Cuadro Básico"
        ESPECIAL = "ESPECIAL", "Especial"
        INSTITUCIONAL = "INSTITUCIONAL", "Institucional"

    id = models.BigAutoField(primary_key=True, db_column="id_medic")
    name = models.CharField(max_length=150, db_column="ds_medic")
    generic_name = models.CharField(
        max_length=150, db_column="ds_activo", null=True, blank=True,
    )
    presentation = models.CharField(
        max_length=150, db_column="presentacion", null=True, blank=True,
    )
    cuadro_basico = models.CharField(
        max_length=20,
        choices=CuadroBasico.choices,
        db_column="sw_cbasico",
        default=CuadroBasico.BASICO,
    )
    is_controlled = models.BooleanField(db_column="es_controlado", default=False)
    max_quantity = models.PositiveIntegerField(
        db_column="no_caja", null=True, blank=True,
    )

    class Meta:
        db_table = "cat_medicamentos"
        managed = True
