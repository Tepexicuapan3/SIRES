# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase


class Especialidades(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_espec")
    name = models.CharField(max_length=100, db_column="especialidad")
    
    class Meta:
        db_table = "cat_especialidades"
        managed = False