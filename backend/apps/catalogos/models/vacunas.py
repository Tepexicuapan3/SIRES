from django.db import models
from .base import CatalogBase


class Vacunas(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_vacuna")
    name = models.CharField(max_length=200, db_column="nombre")

    class Meta:
        db_table = "cat_vacunas"
        managed = False

    def __str__(self):
        return self.name
