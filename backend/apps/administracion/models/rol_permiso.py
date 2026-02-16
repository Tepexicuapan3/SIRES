'''from django.db import models

class RelRolPermiso(models.Model):
    id_rol_permiso = models.BigAutoField(primary_key=True, db_column="id_rol_permiso")
    fch_asignacion = models.DateTimeField(auto_now_add=True)
    fch_baja = models.DateTimeField(null=True, blank=True)
    id_rol = models.ForeignKey(
        "catalogos.CatRol",
        db_column="id_rol",
        on_delete=models.CASCADE,
    )
    id_permiso = models.ForeignKey(
        "catalogos.CatPermiso",
        db_column="id_permiso",
        on_delete=models.CASCADE,
    )
    usr_asignacion = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_asignacion",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="permisos_asignados",
    )
    usr_baja = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_baja",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="permisos_revocados",
    )

    class Meta:
        db_table = "rel_rol_permisos"
        constraints = [
            models.UniqueConstraint(fields=("id_rol", "id_permiso"), name="rel_rol_perm_unique")
        ]'''

from django.db import models


class RelRolPermiso(models.Model):
    id_rol_permiso = models.BigAutoField(
        primary_key=True,
        db_column="id_rol_permiso"
    )

    fch_asignacion = models.DateTimeField(auto_now_add=True)
    fch_baja = models.DateTimeField(null=True, blank=True)

    id_rol = models.ForeignKey(
        "catalogos.Roles",
        db_column="id_rol",
        on_delete=models.CASCADE,
    )

    id_permiso = models.ForeignKey(
        "catalogos.Permisos",
        db_column="id_permiso",
        on_delete=models.CASCADE,
    )

    usr_asignacion = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_asignacion",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="permisos_asignados",
    )

    usr_baja = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_baja",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="permisos_revocados",
    )

    class Meta:
        db_table = "rel_rol_permisos"
        managed = False
        constraints = [
            models.UniqueConstraint(
                fields=("id_rol", "id_permiso"),
                name="rel_rol_perm_unique"
            )
        ]

