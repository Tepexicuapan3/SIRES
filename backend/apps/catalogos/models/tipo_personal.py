from django.db import models
from .base import CatalogBase


class CatTipoPersonal(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_tipo_personal")
    name = models.CharField(max_length=80, db_column="nombre")

    class Meta:
        db_table = "cat_tipo_personal"
        managed = True
