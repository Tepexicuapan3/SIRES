# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase

class Autorizadores(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_autorizador")
    center = models.ForeignKey(
        "catalogos.CatCentroAtencion",
        on_delete=models.PROTECT,
        db_column="id_centro_atencion",
        related_name="autorizadores",
    )
    name = models.CharField(max_length=100, db_column="autorizador")
    position = models.CharField(max_length=60, db_column="cargo")
    authorization_type = models.ForeignKey(
        "catalogos.TpAutorizacion",
        on_delete=models.PROTECT,
        db_column="id_tpautorizacion",
        related_name="autorizadores",
    )
    signature_image = models.CharField(max_length=200, db_column="img_firma", null=True, blank=True)
    authorizer_password = models.CharField(max_length=20, db_column="pwd_autorizador")
    user = models.ForeignKey(
        "authentication.SyUsuario",
        on_delete=models.PROTECT,
        db_column="id_usuario",
        related_name="autorizaciones",
    )
    file_number = models.CharField(max_length=8, db_column="expediente", null=True, blank=True)

    class Meta:
        db_table = "cat_autorizadores"
        managed = True