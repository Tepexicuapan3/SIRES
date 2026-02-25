from django.db import models


class Visit(models.Model):
    class ArrivalType(models.TextChoices):
        APPOINTMENT = "appointment", "appointment"
        WALK_IN = "walk_in", "walk_in"

    class ServiceType(models.TextChoices):
        MEDICINA_GENERAL = "medicina_general", "medicina_general"
        ESPECIALIDAD = "especialidad", "especialidad"
        URGENCIAS = "urgencias", "urgencias"

    id_visit = models.BigAutoField(primary_key=True, db_column="id_visit")
    # unique=True ya crea indice, no hace falta db_index=True
    folio = models.CharField(max_length=32, db_column="folio", unique=True)
    patient_id = models.BigIntegerField(db_column="patient_id", db_index=True)
    arrival_type = models.CharField(
        max_length=16,
        choices=ArrivalType.choices,
        db_column="arrival_type",
    )
    service_type = models.CharField(
        max_length=32,
        choices=ServiceType.choices,
        db_column="service_type",
        default=ServiceType.MEDICINA_GENERAL,
    )
    appointment_id = models.CharField(
        max_length=64,
        db_column="appointment_id",
        null=True,
        blank=True,
    )
    # correcto para filtro doctorId
    doctor_id = models.BigIntegerField(
        db_column="doctor_id",
        null=True,
        blank=True,
        db_index=True,
    )
    notes = models.CharField(
        max_length=255,
        db_column="notes",
        null=True,
        blank=True,
    )
    # dejamos db_index en el campo y quitamos el indice duplicado en Meta
    status = models.CharField(max_length=32, db_column="status", db_index=True)
    fch_alta = models.DateTimeField(auto_now_add=True, db_column="fch_alta")
    fch_modf = models.DateTimeField(auto_now=True, db_column="fch_modf")
    # baja logica: null cuando sigue activa
    fch_baja = models.DateTimeField(db_column="fch_baja", null=True, blank=True)
    
    class Meta:
        db_table = "rcp_visits"
        indexes = [
            models.Index(fields=["doctor_id", "status"], name="rcp_visits_doc_status_idx"),
            models.Index(fields=["fch_alta"], name="rcp_visits_fch_alta_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                name="rcp_visits_arrival_appointment_ck",
                condition=(
                    (
                        models.Q(arrival_type="appointment")
                        & models.Q(appointment_id__isnull=False)
                        & ~models.Q(appointment_id="")
                    )
                    | (
                        models.Q(arrival_type="walk_in")
                        & (models.Q(appointment_id__isnull=True) | models.Q(appointment_id=""))
                    )
                ),
            ),
        ]
