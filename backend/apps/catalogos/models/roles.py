# Author: Victor Hugo Alpizar Cedillo 
'''from django.db import models
from .base import CatalogBase

class Roles(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_rol")
    name = models.CharField(max_length=80, db_column="rol")
    description = models.CharField(max_length=255, db_column="desc_rol")
    landing_route = models.CharField(max_length=120, db_column="landing_route")
    is_admin = models.BooleanField(db_column="is_admin")
    is_system = models.BooleanField(db_column="es_sistema")
 
    class Meta:
        db_table = "cat_roles"
        managed = False'''
from django.db import models
from .base import CatalogBase


class Roles(CatalogBase):
    id_rol = models.BigAutoField(primary_key=True, db_column="id_rol")
    rol = models.CharField(max_length=80, db_column="rol")
    desc_rol = models.CharField(max_length=255, db_column="desc_rol")
    landing_route = models.CharField(max_length=120, db_column="landing_route")
    is_admin = models.BooleanField(db_column="is_admin")
    es_sistema = models.BooleanField(db_column="es_sistema")

    class Meta:
        db_table = "cat_roles"
        managed = False
