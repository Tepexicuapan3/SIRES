# Author: Victor Hugo Alpizar Cedillo 
'''from django.db import models
from .base import CatalogBase


class Permisos(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_permiso")
    code = models.CharField(max_length=120, db_column="codigo")
    name = models.CharField(max_length=255, db_column="descripcion")
    is_system = models.BooleanField(db_column="es_sistema")
    
    class Meta:
        db_table = "cat_permisos"
        managed = False'''

from django.db import models
from .base import CatalogBase


class Permisos(CatalogBase):
    id_permiso = models.BigAutoField(primary_key=True, db_column="id_permiso")
    codigo = models.CharField(max_length=120, db_column="codigo")
    descripcion = models.CharField(max_length=255, db_column="descripcion")
    es_sistema = models.BooleanField(db_column="es_sistema")

    class Meta:
        db_table = "cat_permisos"
        managed = False
