from django.db import models


class CatEmpleado(models.Model):
    """
    Catálogo de empleados.
    Tabla replicada desde Oracle; los datos llegan vía el servicio de sincronización.
    """

    no_exp              = models.CharField(max_length=20, primary_key=True, db_column='NO_EXP')
    ds_paterno          = models.CharField(max_length=100, null=True, blank=True, db_column='DS_PATERNO')
    ds_materno          = models.CharField(max_length=100, null=True, blank=True, db_column='DS_MATERNO')
    ds_nombre           = models.CharField(max_length=100, null=True, blank=True, db_column='DS_NOMBRE')
    cd_laboral          = models.CharField(max_length=100, null=True, blank=True, db_column='CD_LABORAL')
    cve_cd_laboral      = models.CharField(max_length=10,  null=True, blank=True, db_column='CVE_CD_LABORAL')
    cve_baja            = models.CharField(max_length=10,  null=True, blank=True, db_column='CVE_BAJA')
    fec_baja            = models.DateField(null=True, blank=True, db_column='FEC_BAJA')
    fe_nac              = models.DateField(null=True, blank=True, db_column='FE_NAC')
    fec_vig             = models.DateField(null=True, blank=True, db_column='FEC_VIG')
    cd_clinica          = models.CharField(max_length=10,  null=True, blank=True, db_column='CD_CLINICA')
    fec_ult_actualizacion = models.DateTimeField(null=True, blank=True, db_column='FEC_ULT_ACTUALIZACION')

    class Meta:
        app_label = 'administracion'
        db_table  = 'cat_empleados'
        managed   = False   # Django NO gestiona esta tabla (es replicada)

    def __str__(self):
        return f"{self.no_exp} – {self.ds_nombre} {self.ds_paterno}"