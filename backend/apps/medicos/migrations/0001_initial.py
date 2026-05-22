import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("authentication", "0007_det_usuario_tipo_personal_calidad_laboral"),
        ("catalogos", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="CatMedico",
            fields=[
                ("id_usuario", models.OneToOneField(
                    db_column="id_usuario", on_delete=django.db.models.deletion.CASCADE,
                    primary_key=True, related_name="medico", to="authentication.syusuario",
                )),
                ("tipo_medico", models.CharField(max_length=10, default="CLINICA",
                    choices=[("CLINICA","Clínica"),("HOSPITAL","Hospital"),("AMBOS","Ambos")])),
                ("servicio", models.CharField(max_length=100, null=True, blank=True)),
                ("observaciones", models.TextField(null=True, blank=True)),
                ("estatus_medico", models.CharField(max_length=20, default="ACTIVO", db_index=True,
                    choices=[("ACTIVO","Activo"),("VACACIONES","Vacaciones"),
                             ("INCAPACIDAD","Incapacidad"),("SUSPENDIDO","Suspendido"),("BAJA","Baja")])),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(null=True, blank=True)),
                ("created_by_id", models.BigIntegerField(null=True, blank=True)),
                ("updated_by_id", models.BigIntegerField(null=True, blank=True)),
            ],
            options={"db_table": "cat_medicos"},
        ),
        migrations.CreateModel(
            name="RelMedicoEspecialidad",
            fields=[
                ("id", models.BigAutoField(primary_key=True)),
                ("medico", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                    related_name="especialidades", to="medicos.catmedico")),
                ("especialidad", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT,
                    to="catalogos.especialidades")),
                ("es_principal", models.BooleanField(default=False)),
            ],
            options={"db_table": "rel_medico_especialidad",
                     "unique_together": {("medico", "especialidad")}},
        ),
        migrations.CreateModel(
            name="RelMedicoCentro",
            fields=[
                ("id", models.BigAutoField(primary_key=True)),
                ("medico", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                    related_name="centros", to="medicos.catmedico")),
                ("centro", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT,
                    to="catalogos.catcentroatencion")),
                ("tipo_adscripcion", models.CharField(max_length=10, default="DEFINITIVA")),
                ("fecha_inicio", models.DateField()),
                ("fecha_fin", models.DateField(null=True, blank=True)),
                ("is_active", models.BooleanField(default=True, db_index=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by_id", models.BigIntegerField(null=True, blank=True)),
            ],
            options={"db_table": "rel_medico_centro",
                     "unique_together": {("medico", "centro", "fecha_inicio")}},
        ),
        migrations.CreateModel(
            name="RelMedicoConsultorio",
            fields=[
                ("id", models.BigAutoField(primary_key=True)),
                ("medico", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                    related_name="consultorios", to="medicos.catmedico")),
                ("consultorio", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT,
                    to="catalogos.consultorios")),
                ("tipo_asignacion", models.CharField(max_length=10, default="PERMANENTE")),
                ("fecha_inicio", models.DateField()),
                ("fecha_fin", models.DateField(null=True, blank=True)),
                ("is_active", models.BooleanField(default=True, db_index=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by_id", models.BigIntegerField(null=True, blank=True)),
            ],
            options={"db_table": "rel_medico_consultorio"},
        ),
        migrations.CreateModel(
            name="RelMedicoConsultorioHorario",
            fields=[
                ("id", models.BigAutoField(primary_key=True)),
                ("rel_medico_consultorio", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="horarios", to="medicos.relmedicoconsultorio")),
                ("dia_semana", models.CharField(max_length=10)),
                ("hora_inicio", models.TimeField()),
                ("hora_fin", models.TimeField()),
                ("intervalo_cita_min", models.SmallIntegerField(default=20)),
            ],
            options={"db_table": "rel_medico_consultorio_horario",
                     "unique_together": {("rel_medico_consultorio", "dia_semana", "hora_inicio")}},
        ),
        migrations.CreateModel(
            name="RelMedicoExcepcion",
            fields=[
                ("id", models.BigAutoField(primary_key=True)),
                ("medico", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                    related_name="excepciones", to="medicos.catmedico")),
                ("tipo", models.CharField(max_length=20, db_index=True)),
                ("fecha_inicio", models.DateField(db_index=True)),
                ("fecha_fin", models.DateField()),
                ("hora_inicio", models.TimeField(null=True, blank=True)),
                ("hora_fin", models.TimeField(null=True, blank=True)),
                ("consultorio", models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL,
                    null=True, blank=True, to="catalogos.consultorios")),
                ("motivo", models.CharField(max_length=255, null=True, blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by_id", models.BigIntegerField(null=True, blank=True)),
            ],
            options={"db_table": "rel_medico_excepcion"},
        ),
        migrations.AddIndex(
            model_name="relmedicoexcepcion",
            index=models.Index(fields=["medico", "fecha_inicio", "fecha_fin"],
                               name="rel_med_exc_fecha_idx"),
        ),
        migrations.CreateModel(
            name="RelMedicoCobertura",
            fields=[
                ("id", models.BigAutoField(primary_key=True)),
                ("medico_suplente", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                    related_name="coberturas_como_suplente", to="medicos.catmedico")),
                ("medico_titular", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                    related_name="coberturas_como_titular", to="medicos.catmedico")),
                ("consultorio", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT,
                    to="catalogos.consultorios")),
                ("centro", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT,
                    to="catalogos.catcentroatencion")),
                ("fecha_inicio", models.DateField(db_index=True)),
                ("fecha_fin", models.DateField()),
                ("motivo", models.CharField(max_length=20)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by_id", models.BigIntegerField(null=True, blank=True)),
            ],
            options={"db_table": "rel_medico_cobertura"},
        ),
        migrations.CreateModel(
            name="RelMedicoCoberturaHorario",
            fields=[
                ("id", models.BigAutoField(primary_key=True)),
                ("cobertura", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                    related_name="horarios", to="medicos.relmedicocobertura")),
                ("dia_semana", models.CharField(max_length=10)),
                ("hora_inicio", models.TimeField()),
                ("hora_fin", models.TimeField()),
            ],
            options={"db_table": "rel_medico_cobertura_horario"},
        ),
    ]
