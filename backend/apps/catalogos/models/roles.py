from django.db import models

class Roles(models.Model):
    id_rol = models.BigAutoField(primary_key=True, db_column="id_rol")
    rol = models.CharField(max_length=80, db_column="rol", unique=True)
    desc_rol = models.CharField(max_length=255, db_column="desc_rol")
    landing_route = models.CharField(max_length=120, db_column="landing_route", null=True, blank=True)
    is_admin = models.BooleanField(db_column="is_admin", db_index=True, default=False)
    es_sistema = models.BooleanField(db_column="es_sistema", db_index=True, default=False)
    is_active = models.BooleanField(db_column="est_activo", default=True, db_index=True)
    created_at = models.DateTimeField(db_column="fch_alta", auto_now_add=True)
    updated_at = models.DateTimeField(db_column="fch_modf", null=True, blank=True)
    deleted_at = models.DateTimeField(db_column="fch_baja", null=True, blank=True)

    class Meta:
        db_table = "cat_roles"
        managed = False

    @property
    def created_by_id(self):
        return None

    @property
    def updated_by_id(self):
        return None

    @property
    def id(self):
        return self.id_rol

    @property
    def name(self):
        return self.rol

    @property
    def description(self):
        return self.desc_rol

    @property
    def is_system(self):
        return self.es_sistema
