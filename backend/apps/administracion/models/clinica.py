from django.db import models


class CatClinica(models.Model):
    """
    Catálogo de clínicas.
    Tabla replicada desde Oracle.
    """

    cd_clinica = models.CharField(max_length=10, primary_key=True, db_column='cd_clinica')
    ds_clinica = models.CharField(max_length=100, null=True, blank=True, db_column='ds_clinica')

    class Meta:
        app_label = 'administracion'
        db_table  = 'cat_clinicas'
        managed   = False

    def __str__(self):
        return f"{self.cd_clinica} – {self.ds_clinica}"
