from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("authentication", "0001_initial"),
        ("catalogos", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="RelUsuarioRol",
            fields=[
                (
                    "id_usuario_rol",
                    models.BigAutoField(primary_key=True, serialize=False, db_column="id_usuario_rol"),
                ),
                ("is_primary", models.BooleanField(default=False)),
                ("fch_asignacion", models.DateTimeField(auto_now_add=True)),
                ("fch_baja", models.DateTimeField(blank=True, null=True)),
                (
                    "id_usuario",
                    models.ForeignKey(
                        db_column="id_usuario",
                        on_delete=django.db.models.deletion.CASCADE,
                        to="authentication.syusuario",
                    ),
                ),
                (
                    "id_rol",
                    models.ForeignKey(
                        db_column="id_rol",
                        on_delete=django.db.models.deletion.CASCADE,
                        to="catalogos.catrol",
                    ),
                ),
                (
                    "usr_asignacion",
                    models.ForeignKey(
                        blank=True,
                        db_column="usr_asignacion",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="roles_asignados",
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
                        related_name="roles_revocados",
                        to="authentication.syusuario",
                    ),
                ),
            ],
            options={
                "db_table": "rel_usuario_roles",
                "constraints": [
                    models.UniqueConstraint(
                        fields=("id_usuario", "id_rol"), name="rel_usr_rol_unique"
                    )
                ],
                "indexes": [
                    models.Index(
                        fields=["id_usuario", "is_primary"], name="rel_usr_primary_idx"
                    )
                ],
            },
        ),
        migrations.CreateModel(
            name="RelRolPermiso",
            fields=[
                (
                    "id_rol_permiso",
                    models.BigAutoField(primary_key=True, serialize=False, db_column="id_rol_permiso"),
                ),
                ("fch_asignacion", models.DateTimeField(auto_now_add=True)),
                ("fch_baja", models.DateTimeField(blank=True, null=True)),
                (
                    "id_rol",
                    models.ForeignKey(
                        db_column="id_rol",
                        on_delete=django.db.models.deletion.CASCADE,
                        to="catalogos.catrol",
                    ),
                ),
                (
                    "id_permiso",
                    models.ForeignKey(
                        db_column="id_permiso",
                        on_delete=django.db.models.deletion.CASCADE,
                        to="catalogos.catpermiso",
                    ),
                ),
                (
                    "usr_asignacion",
                    models.ForeignKey(
                        blank=True,
                        db_column="usr_asignacion",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="permisos_asignados",
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
                        related_name="permisos_revocados",
                        to="authentication.syusuario",
                    ),
                ),
            ],
            options={
                "db_table": "rel_rol_permisos",
                "constraints": [
                    models.UniqueConstraint(
                        fields=("id_rol", "id_permiso"), name="rel_rol_perm_unique"
                    )
                ],
            },
        ),
        migrations.CreateModel(
            name="RelUsuarioOverride",
            fields=[
                (
                    "id_override",
                    models.BigAutoField(primary_key=True, serialize=False, db_column="id_override"),
                ),
                (
                    "efecto",
                    models.CharField(
                        choices=[("ALLOW", "ALLOW"), ("DENY", "DENY")], max_length=5
                    ),
                ),
                ("fch_asignacion", models.DateTimeField(auto_now_add=True)),
                ("fch_expira", models.DateTimeField(blank=True, null=True)),
                ("fch_baja", models.DateTimeField(blank=True, null=True)),
                (
                    "id_usuario",
                    models.ForeignKey(
                        db_column="id_usuario",
                        on_delete=django.db.models.deletion.CASCADE,
                        to="authentication.syusuario",
                    ),
                ),
                (
                    "id_permiso",
                    models.ForeignKey(
                        db_column="id_permiso",
                        on_delete=django.db.models.deletion.CASCADE,
                        to="catalogos.catpermiso",
                    ),
                ),
                (
                    "usr_asignacion",
                    models.ForeignKey(
                        blank=True,
                        db_column="usr_asignacion",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="overrides_asignados",
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
                        related_name="overrides_revocados",
                        to="authentication.syusuario",
                    ),
                ),
            ],
            options={
                "db_table": "rel_usuario_overrides",
                "constraints": [
                    models.UniqueConstraint(
                        fields=("id_usuario", "id_permiso"), name="rel_usr_override_unique"
                    )
                ],
            },
        ),
        migrations.CreateModel(
            name="AuditoriaEvento",
            fields=[
                (
                    "id_evento",
                    models.BigAutoField(primary_key=True, serialize=False, db_column="id_evento"),
                ),
                ("fch_evento", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("request_id", models.CharField(max_length=36, db_index=True)),
                ("accion", models.CharField(max_length=64, db_index=True)),
                ("recurso_tipo", models.CharField(max_length=64)),
                ("recurso_id", models.BigIntegerField(blank=True, null=True)),
                ("actor_nombre", models.CharField(blank=True, max_length=255, null=True)),
                ("target_nombre", models.CharField(blank=True, max_length=255, null=True)),
                ("ip_origen", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.CharField(blank=True, max_length=255, null=True)),
                (
                    "resultado",
                    models.CharField(
                        choices=[("SUCCESS", "SUCCESS"), ("FAIL", "FAIL")], max_length=7
                    ),
                ),
                ("codigo_error", models.CharField(blank=True, max_length=64, null=True)),
                ("datos_antes", models.JSONField(blank=True, null=True)),
                ("datos_despues", models.JSONField(blank=True, null=True)),
                ("meta", models.JSONField(blank=True, null=True)),
                (
                    "actor_usuario",
                    models.ForeignKey(
                        blank=True,
                        db_column="actor_id_usuario",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="eventos_actor",
                        to="authentication.syusuario",
                    ),
                ),
                (
                    "target_usuario",
                    models.ForeignKey(
                        blank=True,
                        db_column="target_id_usuario",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="eventos_target",
                        to="authentication.syusuario",
                    ),
                ),
                (
                    "id_centro_atencion",
                    models.ForeignKey(
                        blank=True,
                        db_column="id_centro_atencion",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="catalogos.catcentroatencion",
                    ),
                ),
            ],
            options={
                "db_table": "auditoria_eventos",
                "indexes": [
                    models.Index(fields=["actor_usuario", "fch_evento"], name="audit_actor_fch_idx"),
                    models.Index(fields=["target_usuario", "fch_evento"], name="audit_target_fch_idx"),
                    models.Index(fields=["accion", "fch_evento"], name="audit_action_fch_idx"),
                ],
            },
        ),
    ]
