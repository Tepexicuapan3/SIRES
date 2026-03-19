from django.db import models


class CatFamiliar(models.Model):
    """
    Catálogo de familiares de empleados.
    Tabla replicada desde Oracle.
    """

    pk_num          = models.IntegerField(primary_key=True, db_column='PK_NUM')
    no_expf         = models.CharField(max_length=20, db_column='NO_EXPF')
    ds_paterno      = models.CharField(max_length=100, null=True, blank=True, db_column='DS_PATERNO')
    ds_materno      = models.CharField(max_length=100, null=True, blank=True, db_column='DS_MATERNO')
    ds_nombre       = models.CharField(max_length=100, null=True, blank=True, db_column='DS_NOMBRE')
    cd_parentesco   = models.CharField(max_length=50,  null=True, blank=True, db_column='CD_PARENTESCO')
    fe_nac          = models.DateField(null=True, blank=True, db_column='FE_NAC')
    fec_vig         = models.DateField(null=True, blank=True, db_column='FEC_VIG')
    cd_clinica      = models.CharField(max_length=10,  null=True, blank=True, db_column='CD_CLINICA')
    fec_ult_actualizacion = models.DateTimeField(null=True, blank=True, db_column='FEC_ULT_ACTUALIZACION')

    class Meta:
        app_label = 'administracion'
        db_table  = 'cat_familiar'
        managed   = False

    def __str__(self):
        return f"PKN {self.pk_num} – {self.ds_nombre} (Exp: {self.no_expf})"