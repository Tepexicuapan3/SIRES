from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("authentication", "0001_initial"),
        ("catalogos", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="DetUsuario",
            fields=[
                (
                    "id_usuario",
                    models.OneToOneField(
                        db_column="id_usuario",
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        serialize=False,
                        to="authentication.syusuario",
                    ),
                ),
                ("nombre", models.CharField(max_length=80)),
                ("paterno", models.CharField(max_length=80)),
                ("materno", models.CharField(blank=True, max_length=80, null=True)),
                ("nombre_completo", models.CharField(db_index=True, max_length=255)),
                (
                    "id_centro_atencion",
                    models.ForeignKey(
                        blank=True,
                        db_column="id_centro_atencion",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="catalogos.CatCentroAtencion",
                    ),
                ),
            ],
            options={"db_table": "det_usuarios"},
        ),
    ]
