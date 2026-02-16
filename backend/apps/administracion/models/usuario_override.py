'''from django.db import models

class RelUsuarioOverride(models.Model):
    class Efecto(models.TextChoices):
        ALLOW = "ALLOW", "ALLOW"
        DENY = "DENY", "DENY"

    id_override = models.BigAutoField(primary_key=True, db_column="id_override")
    efecto = models.CharField(max_length=5, choices=Efecto.choices)
    fch_asignacion = models.DateTimeField(auto_now_add=True)
    fch_expira = models.DateTimeField(null=True, blank=True)
    fch_baja = models.DateTimeField(null=True, blank=True)
    id_usuario = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="id_usuario",
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
        related_name="overrides_asignados",
    )
    usr_baja = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_baja",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="overrides_revocados",
    )

    class Meta:
        db_table = "rel_usuario_overrides"
        constraints = [
            models.UniqueConstraint(
                fields=("id_usuario", "id_permiso"), name="rel_usr_override_unique"
            )
        ]
'''

from django.db import models


class RelUsuarioOverride(models.Model):
    class Efecto(models.TextChoices):
        ALLOW = "ALLOW", "ALLOW"
        DENY = "DENY", "DENY"

    id_override = models.BigAutoField(primary_key=True, db_column="id_override")
    efecto = models.CharField(max_length=5, choices=Efecto.choices)
    fch_asignacion = models.DateTimeField(auto_now_add=True)
    fch_expira = models.DateTimeField(null=True, blank=True)
    fch_baja = models.DateTimeField(null=True, blank=True)

    id_usuario = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="id_usuario",
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
        related_name="overrides_asignados",
    )

    usr_baja = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_baja",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="overrides_revocados",
    )

    class Meta:
        db_table = "rel_usuario_overrides"
        managed = False
        constraints = [
            models.UniqueConstraint(
                fields=("id_usuario", "id_permiso"),
                name="rel_usr_override_unique",
            )
        ]
