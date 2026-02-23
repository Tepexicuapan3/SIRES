# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase

class Consultorios(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_consult")
    name = models.CharField(max_length=50, db_column="consult")
    code = models.IntegerField(db_column="no_consult")
    id_turn = models.ForeignKey(
        "catalogos.Turnos",
        db_column="id_trno",
        on_delete=models.PROTECT,
    )
    id_center = models.ForeignKey(
        "catalogos.CatCentroAtencion",
        db_column="id_centro_atencion",
        on_delete=models.PROTECT,
    )     
    class Meta:
        db_table = "cat_consultorios"
        managed = False