from django.db import models
from .base import CatalogBase


class Religion(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_religion")
    name = models.CharField(max_length=45, db_column="religion")

    class Meta:
        db_table = "cat_religion"
        managed = True
