# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase

class Escolaridad(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_escol")
    name = models.CharField(max_length=45, db_column="escolaridad")

    class Meta:
        db_table = "cat_escolaridad"
        managed = False