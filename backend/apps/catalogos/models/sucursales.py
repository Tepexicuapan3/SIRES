from django.db import models
from .base import CatalogBase


class CatSucursal(CatalogBase):
    id   = models.BigAutoField(primary_key=True, db_column="id_suc")
    name = models.CharField(max_length=100, db_column="sucursal")

    class Meta:
        db_table = "cat_sucursales"
        managed  = True
        ordering = ["name"]
        verbose_name = "Sucursal"
        verbose_name_plural = "Sucursales"

    def __str__(self) -> str:
        return self.name
