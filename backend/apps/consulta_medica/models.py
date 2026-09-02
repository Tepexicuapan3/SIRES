from django.db import models


class VisitConsultation(models.Model):
    id_consultation = models.BigAutoField(primary_key=True, db_column="id_consulta")
    id_visit = models.OneToOneField(
        "recepcion.Visit",
        db_column="id_visit",
        on_delete=models.CASCADE,
        related_name="consultation",
    )
    doctor = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="id_doctor",
        on_delete=models.PROTECT,
        related_name="consultas_atendidas",
    )
    primary_diagnosis = models.CharField(max_length=255, db_column="diagnostico_primario")
    cie = models.ForeignKey(
        "catalogos.CatCies",
        db_column="clave_cie",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="consultas",
    )
    final_note = models.TextField(db_column="nota_final")
    is_active = models.BooleanField(db_column="est_activo", default=True)
    created_at = models.DateTimeField(db_column="fch_alta", auto_now_add=True)
    updated_at = models.DateTimeField(db_column="fch_modf", auto_now=True)
    deleted_at = models.DateTimeField(db_column="fch_baja", null=True, blank=True)
    created_by_id = models.BigIntegerField(db_column="usr_alta", null=True, blank=True)
    updated_by_id = models.BigIntegerField(db_column="usr_modf", null=True, blank=True)
    deleted_by_id = models.BigIntegerField(db_column="usr_baja", null=True, blank=True)
    class Meta:
        db_table = "cns_visit_consultation"
        indexes = [
            models.Index(fields=["doctor"], name="cns_cons_doc_idx"),
            models.Index(fields=["is_active"], name="cns_cons_active_idx"),
            models.Index(fields=["created_at"], name="cns_cons_created_idx"),
        ]


class VisitConsultationRevision(models.Model):
    """
    Snapshot del valor de ``VisitConsultation`` justo ANTES de que se
    sobrescriba (ver ``ConsultationRepository.upsert_for_visit``).
    Versionado real requerido por NOM-024-SSA3-2012 -- reemplaza el
    anti-patron del legado de pisar el campo in-place sin dejar rastro del
    valor anterior.
    """

    consultation = models.ForeignKey(
        VisitConsultation,
        db_column="id_consulta",
        on_delete=models.CASCADE,
        related_name="revisions",
    )
    previous_primary_diagnosis = models.CharField(
        max_length=255, db_column="diagnostico_primario_anterior"
    )
    previous_cie = models.ForeignKey(
        "catalogos.CatCies",
        db_column="clave_cie_anterior",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="+",
    )
    previous_final_note = models.TextField(db_column="nota_final_anterior")
    changed_by_id = models.BigIntegerField(db_column="usr_modf", null=True, blank=True)
    changed_at = models.DateTimeField(db_column="fch_modf", auto_now_add=True)

    class Meta:
        db_table = "cns_visit_consultation_revision"
        ordering = ["changed_at"]

    def __str__(self) -> str:
        return f"Consulta {self.consultation_id} — revision {self.changed_at}"


class VisitPrescription(models.Model):
    id_prescription = models.BigAutoField(primary_key=True, db_column="id_receta")
    id_visit = models.OneToOneField(
        "recepcion.Visit",
        db_column="id_visit",
        on_delete=models.CASCADE,
        related_name="prescription",
    )
    items = models.JSONField(db_column="items")
    is_active = models.BooleanField(db_column="est_activo", default=True)
    created_at = models.DateTimeField(db_column="fch_alta", auto_now_add=True)
    updated_at = models.DateTimeField(db_column="fch_modf", auto_now=True)
    deleted_at = models.DateTimeField(db_column="fch_baja", null=True, blank=True)
    created_by_id = models.BigIntegerField(db_column="usr_alta", null=True, blank=True)
    updated_by_id = models.BigIntegerField(db_column="usr_modf", null=True, blank=True)
    deleted_by_id = models.BigIntegerField(db_column="usr_baja", null=True, blank=True)

    class Meta:
        db_table = "cns_visit_prescription"
        indexes = [
            models.Index(fields=["is_active"], name="cns_rx_active_idx"),
            models.Index(fields=["created_at"], name="cns_rx_created_idx"),
        ]
