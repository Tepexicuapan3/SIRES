from django.db import models


class Consultorios(models.Model):
    id_consult = models.BigAutoField(primary_key=True, db_column="id_consult")
    no_consult = models.IntegerField(db_column="no_consult")
    id_trno = models.ForeignKey(
        "catalogos.Turnos",
        db_column="id_trno",
        on_delete=models.PROTECT,
    )
    id_centro_atencion = models.ForeignKey(
        "catalogos.CatCentroAtencion",
        db_column="id_centro_atencion",
        on_delete=models.PROTECT,
    )
    consult = models.CharField(max_length=50, db_column="consult")
    est_activo = models.BooleanField(db_column="est_activo", default=True)
    fch_alta = models.DateTimeField(db_column="fch_alta", null=True, blank=True)
    fch_modf = models.DateTimeField(db_column="fch_modf", null=True, blank=True)
    fch_baja = models.DateTimeField(db_column="fch_baja", null=True, blank=True)
    usr_alta = models.BigIntegerField(db_column="usr_alta", null=True, blank=True)
    usr_modf = models.BigIntegerField(db_column="usr_modf", null=True, blank=True)
    usr_baja = models.BigIntegerField(db_column="usr_baja", null=True, blank=True)

    class Meta:
        db_table = "cat_consultorios"
        managed = False
