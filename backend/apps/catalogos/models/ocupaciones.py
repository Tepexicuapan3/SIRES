# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase


class Ocupaciones(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_ocupacion")
    name = models.CharField(max_length=100, db_column="ocupacion")

    class Meta:
        db_table = "cat_ocupaciones"
        managed = False
