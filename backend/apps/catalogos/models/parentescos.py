# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase


class Parentesco(CatalogBase):
    id = models.CharField(primary_key=True, max_length=2, db_column="id_parentesco")
    name = models.CharField(max_length=45, db_column="parentesco")

    class Meta:
        db_table = "cat_parentescos"
        managed = False