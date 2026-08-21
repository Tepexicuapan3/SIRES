from django.db import models


class ModuloPermiso(models.Model):
    """
    Relación N:M entre `Modulo` y `catalogos.Permisos`.

    Semántica OR: un módulo es visible para un usuario si tiene al menos un
    permiso efectivo entre los asociados aquí (ver `RBACResolver`).
    """

    id_modulo_permiso = models.BigAutoField(primary_key=True, db_column="id_modulo_permiso")

    id_modulo = models.ForeignKey(
        "administracion.Modulo",
        db_column="id_modulo",
        on_delete=models.CASCADE,
        related_name="permisos",
    )

    id_permiso = models.ForeignKey(
        "catalogos.Permisos",
        db_column="id_permiso",
        on_delete=models.PROTECT,
        related_name="modulos",
    )

    class Meta:
        db_table = "rel_modulo_permisos"
        managed = True
        constraints = [
            models.UniqueConstraint(
                fields=("id_modulo", "id_permiso"),
                name="rel_modulo_permiso_unique",
            )
        ]

    def __str__(self):
        return f"{self.id_modulo_id} -> {self.id_permiso_id}"
