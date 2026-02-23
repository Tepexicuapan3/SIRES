# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase


class TpAutorizacion(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_tpautorizacion")
    name = models.CharField(max_length=100, db_column="tpautorizacion")
    code = models.CharField(max_length=2, db_column="cve_tpautorizacion")
    
    class Meta:
        db_table = "cat_tpautorizacion"
        managed = False