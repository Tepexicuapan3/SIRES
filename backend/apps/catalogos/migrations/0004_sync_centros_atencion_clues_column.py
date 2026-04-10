from django.db import migrations


def _table_exists(connection, table_name: str) -> bool:
    with connection.cursor() as cursor:
        return table_name in connection.introspection.table_names(cursor)


def _column_names(connection, table_name: str) -> set[str]:
    with connection.cursor() as cursor:
        description = connection.introspection.get_table_description(cursor, table_name)
    return {column.name for column in description}


def _rename_column_if_needed(
    schema_editor,
    *,
    table_name: str,
    old_column: str,
    new_column: str,
) -> None:
    connection = schema_editor.connection
    if not _table_exists(connection, table_name):
        return

    columns = _column_names(connection, table_name)
    if new_column in columns or old_column not in columns:
        return

    qn = schema_editor.quote_name
    schema_editor.execute(
        f"ALTER TABLE {qn(table_name)} RENAME COLUMN {qn(old_column)} TO {qn(new_column)}"
    )


def rename_folio_to_clues(apps, schema_editor):
    _rename_column_if_needed(
        schema_editor,
        table_name="cat_centros_atencion",
        old_column="folio",
        new_column="clues",
    )


def rename_clues_to_folio(apps, schema_editor):
    _rename_column_if_needed(
        schema_editor,
        table_name="cat_centros_atencion",
        old_column="clues",
        new_column="folio",
    )


class Migration(migrations.Migration):
    dependencies = [
        ("catalogos", "0003_catcies"),
    ]

    operations = [
        migrations.RunPython(rename_folio_to_clues, rename_clues_to_folio),
    ]
