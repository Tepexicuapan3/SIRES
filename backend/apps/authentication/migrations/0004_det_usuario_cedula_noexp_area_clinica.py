import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0003_alter_detusuario_options_alter_syusuario_options_and_more"),
        ("catalogos", "0007_catareaclinica_centroareaclinica"),
    ]

    operations = [
        migrations.AddField(
            model_name="detusuario",
            name="no_exp",
            field=models.CharField(
                blank=True,
                db_column="no_exp",
                max_length=20,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="detusuario",
            name="id_area_clinica",
            field=models.ForeignKey(
                blank=True,
                db_column="id_area_clinica",
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="catalogos.catareaClinica",
            ),
        ),
        migrations.CreateModel(
            name="DetUsuarioCedula",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                (
                    "id_usuario",
                    models.ForeignKey(
                        db_column="id_usuario",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="cedulas",
                        to="authentication.syusuario",
                    ),
                ),
                ("numero", models.CharField(db_column="numero", max_length=30)),
                (
                    "tipo",
                    models.CharField(
                        choices=[
                            ("PROFESIONAL", "Cédula Profesional"),
                            ("ESPECIALIDAD", "Cédula de Especialidad"),
                            ("SUBESPECIALIDAD", "Cédula de Subespecialidad"),
                        ],
                        db_column="tipo",
                        default="PROFESIONAL",
                        max_length=20,
                    ),
                ),
                ("es_principal", models.BooleanField(db_column="es_principal", default=False)),
                ("orden", models.IntegerField(db_column="orden")),
            ],
            options={
                "verbose_name": "Cédula de Usuario",
                "verbose_name_plural": "Cédulas de Usuario",
                "db_table": "det_usuario_cedulas",
                "ordering": ["orden"],
                "unique_together": {("id_usuario", "orden")},
            },
        ),
    ]
