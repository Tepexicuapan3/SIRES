from django.db import models

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
