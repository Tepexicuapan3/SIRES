from django.db import models
from .base import CatalogBase

class CatCies(CatalogBase):
    code = models.CharField(
        primary_key=True,
        max_length=8,
        db_column="clave"
    )
    description = models.CharField(
        max_length=400,
        db_column="descripcion"
    )
    version = models.CharField(
        max_length=10,
        db_column="version"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "cat_cies"
        managed = True   # IMPORTANTE