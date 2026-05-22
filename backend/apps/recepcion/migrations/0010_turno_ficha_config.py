from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recepcion", "0009_merge_20260520_1618"),
    ]

    operations = [
        migrations.CreateModel(
            name="TurnoFichaConfig",
            fields=[
                ("id",          models.BigAutoField(primary_key=True, serialize=False)),
                ("nombre",      models.CharField(db_column="nombre", max_length=50, unique=True)),
                ("hora_inicio", models.TimeField(db_column="hora_inicio")),
                ("hora_fin",    models.TimeField(db_column="hora_fin")),
                ("max_fichas",  models.PositiveSmallIntegerField(db_column="max_fichas", default=18)),
                ("is_active",   models.BooleanField(db_column="is_active", default=True)),
            ],
            options={
                "db_table": "rcp_turno_ficha_config",
                "ordering": ["hora_inicio"],
            },
        ),
    ]
