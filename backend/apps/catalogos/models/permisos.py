from django.db import models

from .base import CatalogBase


class Permisos(CatalogBase):
    id_permiso = models.BigAutoField(primary_key=True, db_column="id_permiso")
    codigo = models.CharField(max_length=120, db_column="codigo", unique=True)
    descripcion = models.CharField(max_length=255, db_column="descripcion")
    es_sistema = models.BooleanField(db_column="es_sistema", db_index=True, default=False)

    class Meta:
        db_table = "cat_permisos"
        managed = False

    @property
    def id(self):
        return self.id_permiso

    @property
    def code(self):
        return self.codigo

    @property
    def name(self):
        return self.descripcion

    @property
    def description(self):
        return self.descripcion

    @property
    def is_system(self):
        return self.es_sistema
