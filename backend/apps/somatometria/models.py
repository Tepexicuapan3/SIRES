from django.db import models


class VisitVitalSigns(models.Model):
    id_vitals = models.BigAutoField(primary_key=True, db_column="id_vitals")
    id_visit = models.OneToOneField(
        "recepcion.Visit",
        db_column="id_visit",
        on_delete=models.CASCADE,
        related_name="vital_signs",
    )
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, db_column="weight_kg")
    height_cm = models.DecimalField(max_digits=6, decimal_places=2, db_column="height_cm")
    temperature_c = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        db_column="temperature_c",
        null=True,
        blank=True,
    )
    oxygen_saturation_pct = models.PositiveSmallIntegerField(
        db_column="oxygen_saturation_pct",
        null=True,
        blank=True,
    )
    heart_rate_bpm = models.PositiveSmallIntegerField(
        db_column="heart_rate_bpm",
        null=True,
        blank=True,
    )
    respiratory_rate_bpm = models.PositiveSmallIntegerField(
        db_column="respiratory_rate_bpm",
        null=True,
        blank=True,
    )
    blood_pressure_systolic = models.PositiveSmallIntegerField(
        db_column="blood_pressure_systolic",
        null=True,
        blank=True,
    )
    blood_pressure_diastolic = models.PositiveSmallIntegerField(
        db_column="blood_pressure_diastolic",
        null=True,
        blank=True,
    )
    bmi = models.DecimalField(max_digits=6, decimal_places=2, db_column="bmi")
    notes = models.CharField(max_length=255, db_column="notes", null=True, blank=True)
    fch_alta = models.DateTimeField(auto_now_add=True, db_column="fch_alta")
    fch_modf = models.DateTimeField(auto_now=True, db_column="fch_modf")

    class Meta:
        db_table = "smt_visit_vitals"
