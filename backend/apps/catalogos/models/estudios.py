from django.db import models


class Estudios(models.Model):
    """Catalogo cat_estudios (legacy, sin columnas de auditoria)."""

    ACTIVE_FLAG = "1"
    INACTIVE_FLAG = "0"

    id_estudios = models.AutoField(primary_key=True, db_column="cd_estudios")
    name = models.CharField(max_length=255, db_column="ds_estudios")
    precio = models.FloatField(null=True, blank=True, db_column="no_precio")
    study_type = models.CharField(max_length=20, db_column="tp_estudios")
    indication = models.CharField(max_length=700, null=True, blank=True, db_column="ds_indicacion")
    general_flag = models.CharField(max_length=1, null=True, blank=True, db_column="sw_mgral")
    authorized_flag = models.CharField(max_length=1, null=True, blank=True, db_column="sw_autoriza")
    status = models.CharField(max_length=1, default=ACTIVE_FLAG, db_column="sw_status")
    group_type = models.CharField(max_length=5, null=True, blank=True, db_column="tp_grupo")
    provider_id = models.DecimalField(max_digits=10, decimal_places=0, null=True, blank=True, db_column="id_prov")

    class Meta:
        db_table = "cat_estudios"
        managed = False

    @property
    def id(self):
        return self.id_estudios

    @property
    def is_active(self):
        return self.status == self.ACTIVE_FLAG

    @property
    def is_general(self):
        return self.general_flag == self.ACTIVE_FLAG

    @property
    def is_authorized(self):
        return self.authorized_flag == self.ACTIVE_FLAG
