# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase

class Areas(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_area")
    name = models.CharField(max_length=150, db_column="area")
    code = models.CharField(max_length=50, db_column="tparea")
    tipo_area = models.ForeignKey(
        "catalogos.TiposAreas",
        db_column="id_tparea",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "cat_areas"
        managed = False