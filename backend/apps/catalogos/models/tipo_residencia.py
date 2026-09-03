from django.db import models
from .base import CatalogBase


class TipoResidencia(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_residencia")
    name = models.CharField(max_length=45, db_column="residencia")

    class Meta:
        db_table = "cat_residencia"
        managed = True
