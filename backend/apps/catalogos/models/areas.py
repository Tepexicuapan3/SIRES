# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase

class Areas(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_area")
    name = models.CharField(max_length=150, db_column="area")
    code = models.BigIntegerField(db_column="id_tparea")

    class Meta:
        db_table = "cat_areas"
        managed = False