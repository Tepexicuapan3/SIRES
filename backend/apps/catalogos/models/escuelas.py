# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase


class Escuelas(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_esc")
    code = models.CharField(max_length=45, db_column="sigls_esc")
    name = models.CharField(max_length=100, db_column="escuela")

    class Meta:
        db_table = "cat_escuelas"
        managed = False