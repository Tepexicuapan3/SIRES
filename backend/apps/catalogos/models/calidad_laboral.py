# Author: Victor Hugo Alpizar Cedillo 

from django.db import models
from .base import CatalogBase

class CalidadLaboral(CatalogBase):
    id = models.CharField(primary_key=True, max_length=2, db_column="id_calidadlab")
    name = models.CharField(max_length=100, db_column="calidadlab")

    class Meta:
        db_table = "cat_calidadlab"
        managed = False