# Author: Victor Hugo Alpizar Cedillo
from django.db import models
from .base import CatalogBase


class Discapacidades(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_discapacidad")
    code = models.CharField(max_length=10, db_column="clave_discapacidad")
    name = models.CharField(max_length=300, db_column="discapacidad")

    class Meta:
        db_table = "cat_discapacidades"
        managed = True
