# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase


class Turnos(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_trno")
    name = models.CharField(max_length=50, db_column="turno")
 
    class Meta:
        db_table = "cat_turnos"
        managed = False