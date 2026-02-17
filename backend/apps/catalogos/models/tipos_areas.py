# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase


class TiposAreas(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_tparea")
    name = models.CharField(max_length=50, db_column="tparea")

    class Meta:
        db_table = "cat_tpareas"
        managed = False