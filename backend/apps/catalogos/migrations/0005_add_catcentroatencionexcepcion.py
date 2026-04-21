from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("catalogos", "0004_sync_centros_atencion_clues_column"),
    ]

    operations = [
        migrations.CreateModel(
            name="CatCentroAtencionExcepcion",
            fields=[
                ("is_active", models.BooleanField(db_column="est_activo", default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_column="fch_alta")),
                ("updated_at", models.DateTimeField(blank=True, db_column="fch_modf", null=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_column="fch_baja", null=True)),
                ("created_by_id", models.BigIntegerField(blank=True, db_column="usr_alta", null=True)),
                ("updated_by_id", models.BigIntegerField(blank=True, db_column="usr_modf", null=True)),
                ("deleted_by_id", models.BigIntegerField(blank=True, db_column="usr_baja", null=True)),
                ("id", models.BigAutoField(db_column="id_excepcion", primary_key=True, serialize=False)),
                (
                    "center",
                    models.ForeignKey(
                        db_column="id_centro_atencion",
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="excepciones",
                        to="catalogos.catcentroatencion",
                    ),
                ),
                ("date", models.DateField(db_column="fecha")),
                (
                    "tipo",
                    models.CharField(
                        choices=[
                            ("CERRADO", "Cerrado"),
                            ("HORARIO_MODIFICADO", "Horario modificado"),
                            ("AVISO", "Aviso"),
                        ],
                        db_column="tipo",
                        max_length=20,
                    ),
                ),
                ("reason", models.CharField(db_column="motivo", max_length=255)),
                ("opening_time", models.TimeField(blank=True, db_column="hora_apertura", null=True)),
                ("closing_time", models.TimeField(blank=True, db_column="hora_cierre", null=True)),
            ],
            options={
                "verbose_name": "Excepción de Centro de Atención",
                "verbose_name_plural": "Excepciones de Centros de Atención",
                "db_table": "cat_centros_atencion_excepciones",
                "ordering": ["date"],
            },
        ),
        migrations.AlterUniqueTogether(
            name="catcentroatencionexcepcion",
            unique_together={("center", "date")},
        ),
    ]
