'''from django.db import models

class RelUsuarioRol(models.Model):
    id_usuario_rol = models.BigAutoField(primary_key=True, db_column="id_usuario_rol")
    is_primary = models.BooleanField(default=False)
    fch_asignacion = models.DateTimeField(auto_now_add=True)
    fch_baja = models.DateTimeField(null=True, blank=True)
    id_usuario = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="id_usuario",
        on_delete=models.CASCADE,
    )
    id_rol = models.ForeignKey(
        "catalogos.CatRol",
        db_column="id_rol",
        on_delete=models.CASCADE,
    )
    usr_asignacion = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_asignacion",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="roles_asignados",
    )
    usr_baja = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_baja",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="roles_revocados",
    )

    class Meta:
        db_table = "rel_usuario_roles"
        constraints = [
            models.UniqueConstraint(fields=("id_usuario", "id_rol"), name="rel_usr_rol_unique")
        ]
        indexes = [
            models.Index(fields=["id_usuario", "is_primary"], name="rel_usr_primary_idx")
        ]
'''

from django.db import models


class RelUsuarioRol(models.Model):
    id_usuario_rol = models.BigAutoField(primary_key=True, db_column="id_usuario_rol")
    is_primary = models.BooleanField(default=False)
    fch_asignacion = models.DateTimeField(auto_now_add=True)
    fch_baja = models.DateTimeField(null=True, blank=True)

    id_usuario = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="id_usuario",
        on_delete=models.CASCADE,
    )

    id_rol = models.ForeignKey(
        "catalogos.Roles",
        db_column="id_rol",
        on_delete=models.CASCADE,
    )

    usr_asignacion = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_asignacion",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="roles_asignados",
    )

    usr_baja = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_baja",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="roles_revocados",
    )

    class Meta:
        db_table = "rel_usuario_roles"
        managed = False
        constraints = [
            models.UniqueConstraint(
                fields=("id_usuario", "id_rol"),
                name="rel_usr_rol_unique",
            )
        ]
        indexes = [
            models.Index(
                fields=["id_usuario", "is_primary"],
                name="rel_usr_primary_idx",
            )
        ]
