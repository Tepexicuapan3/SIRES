# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase


class EstudiosMed(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_estudiomed")
    name = models.CharField(max_length=255, db_column="estudiomed")
    code = models.DecimalField(max_digits=18, decimal_places=2, db_column="valor", null=True, blank=True)
    study_type = models.CharField(max_length=20, db_column="tp_estudiomed")
    indication = models.CharField(max_length=700, db_column="indicacion")
    is_general = models.CharField(max_length=1, db_column="estudiogral", null=True, blank=True)
    is_authorized = models.CharField(max_length=1, db_column="autorizado", null=True, blank=True)
    group_type = models.IntegerField(db_column="tp_grupo", null=True, blank=True)
    provider_id = models.IntegerField(db_column="id_provedor", null=True, blank=True)
    
    class Meta:
        db_table = "cat_estudiosmed"
        managed = False