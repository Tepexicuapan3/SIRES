# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase


class EdoCivil(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_edocivil")
    name = models.CharField(max_length=45, db_column="edocivil")

    class Meta:
        db_table = "cat_edocivil"
        managed = False
