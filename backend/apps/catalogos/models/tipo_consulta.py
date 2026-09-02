from django.db import models
from .base import CatalogBase


class TipoConsulta(CatalogBase):
    id = models.AutoField(primary_key=True, db_column="id_tpconsulta")
    name = models.CharField(max_length=100, db_column="tpconsulta")

    class Meta:
        db_table = "cat_tpconsulta"
        managed = True
