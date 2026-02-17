# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase


class GruposDeMedicamentos(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_gpomedic")
    name = models.CharField(max_length=255, db_column="gpomedic")
 
    class Meta:
        db_table = "cat_gpomedic"
        managed = False