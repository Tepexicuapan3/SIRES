from django.db import models

from .base import CatalogBase
from .centros_atencion import CatCentroAtencion


class CatAreaClinica(CatalogBase):
    id = models.AutoField(primary_key=True, db_column="id_area_clinica")
    name = models.CharField(max_length=150, unique=True, db_column="nombre")

    class Meta:
        db_table = "cat_areas_clinicas"
        managed = False
        ordering = ["name"]
        verbose_name = "Área Clínica"
        verbose_name_plural = "Áreas Clínicas"

    def __str__(self) -> str:
        return self.name


class CentroAreaClinica(CatalogBase):
    # Django no soporta composite PK nativamente; usamos center como PK a nivel ORM.
    # Las consultas de detalle siempre filtran por (center_id, area_clinica_id).
    center = models.ForeignKey(
        CatCentroAtencion,
        on_delete=models.CASCADE,
        db_column="id_centro_atencion",
        primary_key=True,
        related_name="clinical_areas",
    )
    area_clinica = models.ForeignKey(
        CatAreaClinica,
        on_delete=models.RESTRICT,
        db_column="id_area_clinica",
        related_name="centers",
    )

    class Meta:
        db_table = "centro_area_clinica"
        managed = False
        unique_together = (("center", "area_clinica"),)
        verbose_name = "Área Clínica por Centro"
        verbose_name_plural = "Áreas Clínicas por Centro"

    def __str__(self) -> str:
        return f"{self.center.name} — {self.area_clinica.name}"
