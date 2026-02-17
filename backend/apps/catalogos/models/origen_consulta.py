# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase


class OrigenCons(CatalogBase):
    id = models.CharField(primary_key=True, max_length=2, db_column="id_origencons")
    name = models.CharField(max_length=100, db_column="origencons")

    class Meta:
        db_table = "cat_origencons"
        managed = False