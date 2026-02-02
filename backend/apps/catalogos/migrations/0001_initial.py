from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("authentication", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="CatCentroAtencion",
            fields=[
                (
                    "id_centro_atencion",
                    models.BigAutoField(primary_key=True, serialize=False, db_column="id_centro_atencion"),
                ),
                ("nombre", models.CharField(max_length=120)),
                ("folio", models.CharField(max_length=50, unique=True)),
                ("es_externo", models.BooleanField(default=False)),
                ("est_activo", models.BooleanField(db_index=True, default=True)),
                ("direccion", models.CharField(max_length=255)),
                ("horario", models.JSONField()),
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
                        related_name="centros_creados",
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
                        related_name="centros_modificados",
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
                        related_name="centros_baja",
                        to="authentication.syusuario",
                    ),
                ),
            ],
            options={"db_table": "cat_centros_atencion"},
        ),
        migrations.CreateModel(
            name="CatRol",
            fields=[
                (
                    "id_rol",
                    models.BigAutoField(primary_key=True, serialize=False, db_column="id_rol"),
                ),
                ("rol", models.CharField(max_length=80, unique=True)),
                ("desc_rol", models.CharField(max_length=255)),
                ("landing_route", models.CharField(blank=True, max_length=120, null=True)),
                ("is_admin", models.BooleanField(db_index=True, default=False)),
                ("es_sistema", models.BooleanField(db_index=True, default=False)),
                ("est_activo", models.BooleanField(db_index=True, default=True)),
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
                        related_name="roles_creados",
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
                        related_name="roles_modificados",
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
                        related_name="roles_baja",
                        to="authentication.syusuario",
                    ),
                ),
            ],
            options={"db_table": "cat_roles"},
        ),
        migrations.CreateModel(
            name="CatPermiso",
            fields=[
                (
                    "id_permiso",
                    models.BigAutoField(primary_key=True, serialize=False, db_column="id_permiso"),
                ),
                ("codigo", models.CharField(max_length=120, unique=True)),
                ("descripcion", models.CharField(max_length=255)),
                ("es_sistema", models.BooleanField(db_index=True, default=False)),
                ("est_activo", models.BooleanField(db_index=True, default=True)),
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
                        related_name="permisos_creados",
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
                        related_name="permisos_modificados",
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
                        related_name="permisos_baja",
                        to="authentication.syusuario",
                    ),
                ),
            ],
            options={"db_table": "cat_permisos"},
        ),
    ]
