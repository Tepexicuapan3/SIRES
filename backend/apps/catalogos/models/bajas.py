# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase

class Bajas(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_baja")
    name = models.CharField(max_length=250, db_column="baja")
     
    class Meta:
        db_table = "cat_bajas"
        managed = False