# Reconcilia el ESTADO de migraciones con Consultorios, Areas,
# CatCentroAtencionHorario y CentroAreaClinica -- estas tablas se editaron
# en los modelos (y en algunos ambientes hasta con SQL manual directo) sin
# generar nunca la migracion correspondiente, porque antes eran
# managed=False y makemigrations no se corria para ellas.
#
# Verificamos con introspeccion real (ver auditoria) que la columna fisica
# ya existe en TODOS los escenarios posibles:
#   - Bases ya migradas (ej. local): alguien ya agrego estas columnas a
#     mano por SQL directo, con datos reales cargados.
#   - Bases nuevas: la migracion 0013 ya crea estas tablas leyendo la
#     clase de modelo actual (managed=True), asi que nacen con la forma
#     final de una sola vez.
#
# Por eso esta migracion es puramente de ESTADO (SeparateDatabaseAndState
# con database_operations vacio): no corre ningun ALTER TABLE real, solo
# pone al dia el historial de Django para que makemigrations dejer de
# detectar drift.
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalogos", "0013_create_missing_catalog_tables"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.RenameField(
                    model_name="consultorios",
                    old_name="code",
                    new_name="numero",
                ),
                migrations.AlterField(
                    model_name="areas",
                    name="code",
                    field=models.CharField(db_column="tparea", max_length=50),
                ),
                migrations.AddField(
                    model_name="areas",
                    name="tipo_area",
                    field=models.ForeignKey(
                        blank=True,
                        db_column="id_tparea",
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        to="catalogos.tiposareas",
                    ),
                ),
                migrations.AddField(
                    model_name="catcentroatencionhorario",
                    name="center",
                    field=models.ForeignKey(
                        db_column="id_centro_atencion",
                        default=None,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="schedules",
                        to="catalogos.catcentroatencion",
                    ),
                    preserve_default=False,
                ),
                migrations.AddField(
                    model_name="catcentroatencionhorario",
                    name="shift",
                    field=models.ForeignKey(
                        db_column="id_turno",
                        default=None,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="center_schedules",
                        to="catalogos.turnos",
                    ),
                    preserve_default=False,
                ),
                migrations.AddField(
                    model_name="consultorios",
                    name="id_center",
                    field=models.ForeignKey(
                        db_column="id_centro_atencion",
                        default=None,
                        on_delete=django.db.models.deletion.PROTECT,
                        to="catalogos.catcentroatencion",
                    ),
                    preserve_default=False,
                ),
                migrations.AddField(
                    model_name="consultorios",
                    name="id_turn",
                    field=models.ForeignKey(
                        db_column="id_trno",
                        default=None,
                        on_delete=django.db.models.deletion.PROTECT,
                        to="catalogos.turnos",
                    ),
                    preserve_default=False,
                ),
                migrations.AlterField(
                    model_name="centroareaclinica",
                    name="center",
                    field=models.OneToOneField(
                        db_column="id_centro_atencion",
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        related_name="clinical_areas",
                        serialize=False,
                        to="catalogos.catcentroatencion",
                    ),
                ),
                migrations.AlterUniqueTogether(
                    name="catcentroatencionhorario",
                    unique_together={("center", "shift", "week_day")},
                ),
                migrations.AlterUniqueTogether(
                    name="centroareaclinica",
                    unique_together={("center", "area_clinica")},
                ),
            ],
            database_operations=[],
        ),
    ]
