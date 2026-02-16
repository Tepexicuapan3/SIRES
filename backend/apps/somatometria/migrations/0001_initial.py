from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="VisitVitalSigns",
            fields=[
                ("id_vitals", models.BigAutoField(db_column="id_vitals", primary_key=True, serialize=False)),
                ("weight_kg", models.DecimalField(db_column="weight_kg", decimal_places=2, max_digits=6)),
                ("height_cm", models.DecimalField(db_column="height_cm", decimal_places=2, max_digits=6)),
                (
                    "temperature_c",
                    models.DecimalField(blank=True, db_column="temperature_c", decimal_places=1, max_digits=4, null=True),
                ),
                (
                    "oxygen_saturation_pct",
                    models.PositiveSmallIntegerField(blank=True, db_column="oxygen_saturation_pct", null=True),
                ),
                ("heart_rate_bpm", models.PositiveSmallIntegerField(blank=True, db_column="heart_rate_bpm", null=True)),
                (
                    "respiratory_rate_bpm",
                    models.PositiveSmallIntegerField(blank=True, db_column="respiratory_rate_bpm", null=True),
                ),
                (
                    "blood_pressure_systolic",
                    models.PositiveSmallIntegerField(blank=True, db_column="blood_pressure_systolic", null=True),
                ),
                (
                    "blood_pressure_diastolic",
                    models.PositiveSmallIntegerField(blank=True, db_column="blood_pressure_diastolic", null=True),
                ),
                ("bmi", models.DecimalField(db_column="bmi", decimal_places=2, max_digits=6)),
                ("notes", models.CharField(blank=True, db_column="notes", max_length=255, null=True)),
                ("fch_alta", models.DateTimeField(auto_now_add=True, db_column="fch_alta")),
                ("fch_modf", models.DateTimeField(auto_now=True, db_column="fch_modf")),
                (
                    "id_visit",
                    models.OneToOneField(
                        db_column="id_visit",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="vital_signs",
                        to="recepcion.visit",
                    ),
                ),
            ],
            options={
                "db_table": "smt_visit_vitals",
            },
        ),
    ]
