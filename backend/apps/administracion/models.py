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
        ]


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


class AuditoriaEvento(models.Model):
    class Resultado(models.TextChoices):
        SUCCESS = "SUCCESS", "SUCCESS"
        FAIL = "FAIL", "FAIL"

    id_evento = models.BigAutoField(primary_key=True, db_column="id_evento")
    fch_evento = models.DateTimeField(auto_now_add=True, db_index=True)
    request_id = models.CharField(max_length=36, db_index=True)
    accion = models.CharField(max_length=64, db_index=True)
    recurso_tipo = models.CharField(max_length=64)
    recurso_id = models.BigIntegerField(null=True, blank=True)
    actor_nombre = models.CharField(max_length=255, null=True, blank=True)
    target_nombre = models.CharField(max_length=255, null=True, blank=True)
    ip_origen = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, null=True, blank=True)
    resultado = models.CharField(max_length=7, choices=Resultado.choices)
    codigo_error = models.CharField(max_length=64, null=True, blank=True)
    datos_antes = models.JSONField(null=True, blank=True)
    datos_despues = models.JSONField(null=True, blank=True)
    meta = models.JSONField(null=True, blank=True)
    actor_usuario = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="actor_id_usuario",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="eventos_actor",
    )
    target_usuario = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="target_id_usuario",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="eventos_target",
    )
    id_centro_atencion = models.ForeignKey(
        "catalogos.CatCentroAtencion",
        db_column="id_centro_atencion",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    class Meta:
        db_table = "auditoria_eventos"
        indexes = [
            models.Index(fields=["actor_usuario", "fch_evento"], name="audit_actor_fch_idx"),
            models.Index(fields=["target_usuario", "fch_evento"], name="audit_target_fch_idx"),
            models.Index(fields=["accion", "fch_evento"], name="audit_action_fch_idx"),
        ]
