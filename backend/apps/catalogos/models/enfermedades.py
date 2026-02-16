# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase

class Enfermedades(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_enf")
    code = models.CharField(max_length=120, db_column="cve_enf")
    name = models.CharField(max_length=400, db_column="enfermedad")
    cie_version = models.CharField(max_length=5, db_column="vers_cie")

    class Meta:
        db_table = "cat_enfermedades"
        managed = False