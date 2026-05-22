"""
Crea las tablas para el módulo de citas médicas:
  - citas_medicas              → CitaMedica
  - citas_horarios_disponibles → HorarioDisponible
  - citas_notificaciones       → CitaNotificacion
"""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recepcion",  "0003_visit_patient_noexp_pknum"),
        ("medicos",    "0001_initial"),
        ("catalogos",  "0001_initial"),
    ]

    operations = [
        # ── CitaMedica ────────────────────────────────────────────────────────
        migrations.CreateModel(
            name="CitaMedica",
            fields=[
                ("id",          models.BigAutoField(primary_key=True, serialize=False)),
                ("folio",       models.CharField(max_length=32, unique=True)),
                ("no_exp",      models.CharField(max_length=20, db_index=True)),
                ("pk_num",      models.SmallIntegerField(default=0)),
                ("medico",      models.ForeignKey(
                    db_column="medico_id",
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="citas",
                    to="medicos.catmedico",
                )),
                ("consultorio", models.ForeignKey(
                    db_column="consultorio_id",
                    null=True, blank=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="citas",
                    to="catalogos.consultorios",
                )),
                ("fecha_hora",    models.DateTimeField(db_index=True)),
                ("duracion_min",  models.SmallIntegerField(default=20)),
                ("servicio_tipo", models.CharField(
                    max_length=32, default="medicina_general",
                    choices=[
                        ("medicina_general", "Medicina general"),
                        ("especialidad",     "Especialidad"),
                        ("urgencias",        "Urgencias"),
                    ],
                )),
                ("estatus", models.CharField(
                    max_length=20, db_index=True, default="agendada",
                    choices=[
                        ("agendada",   "Agendada"),
                        ("confirmada", "Confirmada"),
                        ("atendida",   "Atendida"),
                        ("cancelada",  "Cancelada"),
                        ("no_asistio", "No asistió"),
                    ],
                )),
                ("motivo",        models.CharField(max_length=255, null=True, blank=True)),
                ("notas",         models.TextField(null=True, blank=True)),
                ("created_at",    models.DateTimeField(auto_now_add=True)),
                ("updated_at",    models.DateTimeField(auto_now=True)),
                ("created_by_id", models.BigIntegerField(null=True, blank=True)),
            ],
            options={"db_table": "citas_medicas"},
        ),
        migrations.AddIndex(
            model_name="citamedica",
            index=models.Index(fields=["medico", "fecha_hora"], name="citas_medico_fechahora_idx"),
        ),
        migrations.AddIndex(
            model_name="citamedica",
            index=models.Index(fields=["no_exp", "pk_num"], name="citas_noexp_pknum_idx"),
        ),
        migrations.AddIndex(
            model_name="citamedica",
            index=models.Index(fields=["estatus", "fecha_hora"], name="citas_estatus_fechahora_idx"),
        ),

        # ── HorarioDisponible ─────────────────────────────────────────────────
        migrations.CreateModel(
            name="HorarioDisponible",
            fields=[
                ("id",           models.BigAutoField(primary_key=True, serialize=False)),
                ("medico",       models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="slots",
                    to="medicos.catmedico",
                )),
                ("consultorio",  models.ForeignKey(
                    null=True, blank=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    to="catalogos.consultorios",
                )),
                ("fecha",        models.DateField(db_index=True)),
                ("hora",         models.TimeField()),
                ("duracion_min", models.SmallIntegerField(default=20)),
                ("disponible",   models.BooleanField(default=True, db_index=True)),
                ("cita",         models.OneToOneField(
                    null=True, blank=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="slot",
                    to="recepcion.citamedica",
                )),
            ],
            options={
                "db_table":       "citas_horarios_disponibles",
                "unique_together": {("medico", "fecha", "hora")},
            },
        ),

        # ── CitaNotificacion ──────────────────────────────────────────────────
        migrations.CreateModel(
            name="CitaNotificacion",
            fields=[
                ("id",            models.BigAutoField(primary_key=True, serialize=False)),
                ("cita",          models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="notificaciones",
                    to="recepcion.citamedica",
                )),
                ("tipo",          models.CharField(
                    max_length=20,
                    choices=[("confirmacion", "Confirmación"), ("recordatorio", "Recordatorio")],
                )),
                ("enviado",       models.BooleanField(default=False)),
                ("email_destino", models.EmailField(null=True, blank=True)),
                ("enviado_at",    models.DateTimeField(null=True, blank=True)),
                ("created_at",    models.DateTimeField(auto_now_add=True)),
            ],
            options={"db_table": "citas_notificaciones"},
        ),
    ]
