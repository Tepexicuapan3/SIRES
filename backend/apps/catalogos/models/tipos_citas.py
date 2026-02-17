# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase

class TipoDeCitas(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_tpcita")
    name = models.CharField(max_length=30, db_column="tpcita")
 
    class Meta:
        db_table = "cat_tpcitas"
        managed = False   