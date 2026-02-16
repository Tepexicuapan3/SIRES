# Author: Victor Hugo Alpizar Cedillo 

'''from django.db import models
from .base import CatalogBase

class CentrosAtencion(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_centro_atencion")
    name = models.CharField(max_length=120, db_column="nombre")
    code = models.CharField(max_length=50, db_column="folio")
    is_external = models.BooleanField(db_column="es_externo")
    address = models.CharField(max_length=255, db_column="direccion")
    schedule = models.JSONField(db_column="horario")
    
    class Meta:
        db_table = "cat_centros_atencion"
        managed = False'''

from django.db import models
from .base import CatalogBase

class CatCentroAtencion(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_centro_atencion")
    name = models.CharField(max_length=120, db_column="nombre")
    code = models.CharField(max_length=50, db_column="folio")
    is_external = models.BooleanField(db_column="es_externo")
    address = models.CharField(max_length=255, db_column="direccion")
    schedule = models.JSONField(db_column="horario")

    class Meta:
        db_table = "cat_centros_atencion"
        managed = False
