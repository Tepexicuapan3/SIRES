# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase

class TiposSanguineo(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_tpsanguineo")
    name = models.CharField(max_length=50, db_column="tpsanguineo")

    class Meta:
        db_table = "cat_tpsanguineo"
        managed = False