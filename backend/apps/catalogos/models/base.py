# Author: Victor Hugo Alpizar Cedillo 

from django.db import models

class CatalogBase(models.Model):
    is_active = models.BooleanField(db_column="est_activo")
    created_at = models.DateTimeField(db_column="fch_alta")
    updated_at = models.DateTimeField(db_column="fch_modf", null=True, blank=True)
    deleted_at = models.DateTimeField(db_column="fch_baja", null=True, blank=True)
    created_by_id = models.BigIntegerField(db_column="usr_alta")
    updated_by_id = models.BigIntegerField(db_column="usr_modf", null=True, blank=True)
    deleted_by_id = models.BigIntegerField(db_column="usr_baja", null=True, blank=True)
    class Meta:
        abstract = True