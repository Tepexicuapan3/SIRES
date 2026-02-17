# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase


class Pases(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_pase")
    name = models.CharField(max_length=50, db_column="pase")
 
    class Meta:
        db_table = "cat_pases"
        managed = False