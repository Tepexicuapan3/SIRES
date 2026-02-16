# Author: Victor Hugo Alpizar Cedillo 
from django.db import models
from .base import CatalogBase

class Autorizadores(CatalogBase):
    id = models.BigAutoField(primary_key=True, db_column="id_autorizador")
    center_id = models.BigIntegerField(db_column="id_centro_atencion")
    name = models.CharField(max_length=100, db_column="autorizador")
    position = models.CharField(max_length=60, db_column="cargo")
    authorization_type_id = models.BigIntegerField(db_column="id_tpautorizacion")
    signature_image = models.CharField(max_length=200, db_column="img_firma", null=True, blank=True)
    authorizer_password = models.CharField(max_length=20, db_column="pwd_autorizador")
    user_id = models.BigIntegerField(db_column="id_usuario")
    file_number = models.CharField(max_length=8, db_column="expediente", null=True, blank=True)

    class Meta:
        db_table = "cat_autorizadores"
        managed = False