# CatCentroAtencion (managed=True en 0001_initial, luego flipped a
# managed=False en 0002) evoluciono mucho en el modelo sin generar nunca
# las migraciones correspondientes: se renombro folio->clues, se agregaron
# tipo_centro/folio_clin/codigo_postal/colonia/municipio/estado/ciudad/
# telefono, se elimino el campo horario y direccion paso a ser opcional.
#
# A diferencia de la migracion 0014 (donde TODOS los ambientes ya tenian
# las columnas fisicas), aca el servidor de produccion todavia tiene el
# esquema original de 0001_initial -- por eso "column tipo_centro does
# not exist" al arrancar. Por eso esta migracion SI corre SQL real, pero
# de forma defensiva (columna por columna, verificando que exista antes
# de tocarla) para no romper ambientes que ya tengan algunas de estas
# columnas agregadas a mano (como el caso de Areas/Consultorios en 0014).
import django.db.models.deletion
from django.db import migrations, models


def _column_exists(cursor, table_name, column_name):
    cursor.execute(
        "SELECT 1 FROM information_schema.columns "
        "WHERE table_name = %s AND column_name = %s "
        "AND table_schema = ANY (current_schemas(false))",
        [table_name, column_name],
    )
    return cursor.fetchone() is not None


def reconcile_columns(apps, schema_editor):
    table = "cat_centros_atencion"
    with schema_editor.connection.cursor() as cursor:
        has = lambda col: _column_exists(cursor, table, col)

        if has("folio") and not has("clues"):
            cursor.execute(f'ALTER TABLE {table} RENAME COLUMN folio TO clues;')

        if has("direccion"):
            cursor.execute(f'ALTER TABLE {table} ALTER COLUMN direccion DROP NOT NULL;')

        if has("horario"):
            cursor.execute(f'ALTER TABLE {table} DROP COLUMN horario;')

        if not has("tipo_centro"):
            cursor.execute(f'ALTER TABLE {table} ADD COLUMN tipo_centro varchar(20);')
            cursor.execute(f'CREATE INDEX IF NOT EXISTS cat_centros_atencion_tipo_centro_idx ON {table} (tipo_centro);')

        for column, coltype in [
            ("folio_clin", "varchar(10)"),
            ("codigo_postal", "varchar(5)"),
            ("colonia", "varchar(120)"),
            ("municipio", "varchar(120)"),
            ("estado", "varchar(120)"),
            ("ciudad", "varchar(120)"),
            ("telefono", "varchar(40)"),
        ]:
            if not has(column):
                cursor.execute(f'ALTER TABLE {table} ADD COLUMN {column} {coltype};')


def reconcile_columns_reverse(apps, schema_editor):
    # No revertimos columnas: podrian tener datos reales cargados despues
    # de aplicarse.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("catalogos", "0014_reconcile_model_drift"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.RenameField(
                    model_name="catcentroatencion",
                    old_name="nombre",
                    new_name="name",
                ),
                migrations.RenameField(
                    model_name="catcentroatencion",
                    old_name="folio",
                    new_name="code",
                ),
                migrations.RenameField(
                    model_name="catcentroatencion",
                    old_name="es_externo",
                    new_name="is_external",
                ),
                migrations.RenameField(
                    model_name="catcentroatencion",
                    old_name="direccion",
                    new_name="address",
                ),
                migrations.RemoveField(
                    model_name="catcentroatencion",
                    name="horario",
                ),
                migrations.RemoveField(
                    model_name="catcentroatencion",
                    name="usr_alta",
                ),
                migrations.RemoveField(
                    model_name="catcentroatencion",
                    name="usr_modf",
                ),
                migrations.RemoveField(
                    model_name="catcentroatencion",
                    name="usr_baja",
                ),
                migrations.AlterField(
                    model_name="catcentroatencion",
                    name="code",
                    field=models.CharField(db_column="clues", max_length=50, unique=True),
                ),
                migrations.AlterField(
                    model_name="catcentroatencion",
                    name="address",
                    field=models.CharField(blank=True, db_column="direccion", max_length=255, null=True),
                ),
                migrations.AddField(
                    model_name="catcentroatencion",
                    name="center_type",
                    field=models.CharField(
                        choices=[("CLINICA", "Clínica"), ("HOSPITAL", "Hospital")],
                        db_column="tipo_centro",
                        db_index=True,
                        default="CLINICA",
                        max_length=20,
                    ),
                    preserve_default=False,
                ),
                migrations.AddField(
                    model_name="catcentroatencion",
                    name="legacy_folio",
                    field=models.CharField(blank=True, db_column="folio_clin", max_length=10, null=True),
                ),
                migrations.AddField(
                    model_name="catcentroatencion",
                    name="postal_code",
                    field=models.CharField(blank=True, db_column="codigo_postal", max_length=5, null=True),
                ),
                migrations.AddField(
                    model_name="catcentroatencion",
                    name="neighborhood",
                    field=models.CharField(blank=True, db_column="colonia", max_length=120, null=True),
                ),
                migrations.AddField(
                    model_name="catcentroatencion",
                    name="municipality",
                    field=models.CharField(blank=True, db_column="municipio", max_length=120, null=True),
                ),
                migrations.AddField(
                    model_name="catcentroatencion",
                    name="state",
                    field=models.CharField(blank=True, db_column="estado", max_length=120, null=True),
                ),
                migrations.AddField(
                    model_name="catcentroatencion",
                    name="city",
                    field=models.CharField(blank=True, db_column="ciudad", max_length=120, null=True),
                ),
                migrations.AddField(
                    model_name="catcentroatencion",
                    name="phone",
                    field=models.CharField(blank=True, db_column="telefono", max_length=40, null=True),
                ),
            ],
            database_operations=[
                migrations.RunPython(reconcile_columns, reconcile_columns_reverse),
            ],
        ),
    ]
