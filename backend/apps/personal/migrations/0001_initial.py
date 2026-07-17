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
            name="DetUsuarioMedico",
            fields=[
                ("id_usuario", models.OneToOneField(
                    db_column="id_usuario",
                    on_delete=django.db.models.deletion.CASCADE,
                    primary_key=True,
                    related_name="perfil_medico",
                    to="authentication.syusuario",
                )),
                ("cedula_profesional", models.CharField(max_length=30, null=True, blank=True)),
                ("cedula_especialidad", models.CharField(max_length=30, null=True, blank=True)),
                ("id_especialidad", models.ForeignKey(
                    db_column="id_especialidad",
                    db_constraint=False,
                    null=True, blank=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to="catalogos.especialidades",
                )),
                ("tipo_adscripcion", models.CharField(
                    max_length=20, null=True, blank=True,
                    choices=[("CLINICA", "Clínica"), ("HOSPITAL", "Hospital")],
                )),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(null=True, blank=True)),
                ("created_by_id", models.BigIntegerField(null=True, blank=True)),
                ("updated_by_id", models.BigIntegerField(null=True, blank=True)),
            ],
            options={"db_table": "det_usuario_medico"},
        ),
        migrations.CreateModel(
            name="DetUsuarioEnfermeria",
            fields=[
                ("id_usuario", models.OneToOneField(
                    db_column="id_usuario",
                    on_delete=django.db.models.deletion.CASCADE,
                    primary_key=True,
                    related_name="perfil_enfermeria",
                    to="authentication.syusuario",
                )),
                ("cedula_enfermeria", models.CharField(max_length=30, null=True, blank=True)),
                ("nivel", models.CharField(
                    max_length=20, null=True, blank=True,
                    choices=[("GENERAL", "General"), ("ESPECIALISTA", "Especialista"), ("JEFE_PISO", "Jefe de Piso")],
                )),
                ("id_area_clinica", models.ForeignKey(
                    db_column="id_area_clinica",
                    db_constraint=False,
                    null=True, blank=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to="catalogos.catareaclinica",
                )),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(null=True, blank=True)),
                ("created_by_id", models.BigIntegerField(null=True, blank=True)),
                ("updated_by_id", models.BigIntegerField(null=True, blank=True)),
            ],
            options={"db_table": "det_usuario_enfermeria"},
        ),
        migrations.CreateModel(
            name="DetUsuarioAdministrativo",
            fields=[
                ("id_usuario", models.OneToOneField(
                    db_column="id_usuario",
                    on_delete=django.db.models.deletion.CASCADE,
                    primary_key=True,
                    related_name="perfil_administrativo",
                    to="authentication.syusuario",
                )),
                ("puesto", models.CharField(max_length=100, null=True, blank=True)),
                ("area_administrativa", models.CharField(max_length=100, null=True, blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(null=True, blank=True)),
                ("created_by_id", models.BigIntegerField(null=True, blank=True)),
                ("updated_by_id", models.BigIntegerField(null=True, blank=True)),
            ],
            options={"db_table": "det_usuario_administrativo"},
        ),
    ]
