# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase

class Licencias(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_tplicencia")
    name = models.CharField(max_length=100, db_column="tplicencia")
 
    class Meta:
        db_table = "cat_tplicencia"
        managed = False