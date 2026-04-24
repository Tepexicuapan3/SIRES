from django.db import models


class VacInventario(models.Model):
    id = models.BigAutoField(primary_key=True, db_column="id_inventario")
    vaccine = models.ForeignKey(
        "catalogos.Vacunas",
        on_delete=models.RESTRICT,
        db_column="id_vacuna",
        related_name="inventario",
    )
    center = models.ForeignKey(
        "catalogos.CatCentroAtencion",
        on_delete=models.RESTRICT,
        db_column="id_centro_atencion",
        related_name="inventario_vacunas",
    )
    stock_quantity = models.IntegerField(default=0, db_column="cantidad_existencia")
    applied_doses = models.IntegerField(default=0, db_column="dosis_aplicadas")
    is_active = models.BooleanField(default=True, db_column="est_activo")
    created_at = models.DateTimeField(db_column="fch_alta", null=True, blank=True)
    updated_at = models.DateTimeField(db_column="fch_modf", null=True, blank=True)
    deleted_at = models.DateTimeField(db_column="fch_baja", null=True, blank=True)
    created_by_id = models.BigIntegerField(db_column="usr_alta", null=True, blank=True)
    updated_by_id = models.BigIntegerField(db_column="usr_modf", null=True, blank=True)
    deleted_by_id = models.BigIntegerField(db_column="usr_baja", null=True, blank=True)

    class Meta:
        db_table = "vac_inventario"
        managed = False

    def __str__(self):
        return f"{self.vaccine_id} @ {self.center_id}"
