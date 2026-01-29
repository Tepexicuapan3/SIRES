from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="SyUsuario",
            fields=[
                (
                    "id_usuario",
                    models.BigAutoField(primary_key=True, serialize=False, db_column="id_usuario"),
                ),
                ("usuario", models.CharField(max_length=50, unique=True)),
                ("correo", models.CharField(max_length=255, unique=True)),
                ("clave_hash", models.CharField(max_length=255)),
                ("est_activo", models.BooleanField(db_index=True, default=True)),
                ("est_bloqueado", models.BooleanField(db_index=True, default=False)),
                ("cambiar_clave", models.BooleanField(default=False)),
                ("terminos_acept", models.BooleanField(default=False)),
                ("fch_terminos", models.DateTimeField(blank=True, null=True)),
                (
                    "last_conexion",
                    models.DateTimeField(blank=True, null=True, db_index=True),
                ),
                ("ip_ultima", models.GenericIPAddressField(blank=True, null=True)),
                ("fch_alta", models.DateTimeField(auto_now_add=True)),
                ("fch_modf", models.DateTimeField(blank=True, null=True)),
                ("fch_baja", models.DateTimeField(blank=True, null=True)),
                (
                    "usr_alta",
                    models.ForeignKey(
                        blank=True,
                        db_column="usr_alta",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="usuarios_creados",
                        to="authentication.syusuario",
                    ),
                ),
                (
                    "usr_modf",
                    models.ForeignKey(
                        blank=True,
                        db_column="usr_modf",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="usuarios_modificados",
                        to="authentication.syusuario",
                    ),
                ),
                (
                    "usr_baja",
                    models.ForeignKey(
                        blank=True,
                        db_column="usr_baja",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="usuarios_baja",
                        to="authentication.syusuario",
                    ),
                ),
            ],
            options={"db_table": "sy_usuarios"},
        ),
    ]
