from django.db import connection, transaction

from apps.catalogos.imports.registry import CatalogImportSpec


class CatalogImportRepository:
    def bulk_insert(self, spec: CatalogImportSpec, records: list, user_id: int) -> int:
        objects = [spec.model(created_by_id=user_id, **record) for record in records]

        with transaction.atomic():
            if connection.vendor == "postgresql":
                # Serializa imports concurrentes del mismo catálogo (se libera solo al
                # terminar esta transacción) sin bloquear el CRUD normal de otras filas.
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT pg_advisory_xact_lock(hashtext(%s))",
                        [spec.model._meta.db_table],
                    )

            spec.model.objects.bulk_create(objects)

            if connection.vendor == "postgresql":
                # bulk_create no pasa por Model.save(), así que la secuencia serial de
                # Postgres no avanza sola: sin este setval, el próximo create() vía CRUD
                # normal chocaría con un ID ya insertado por este import.
                quoted_table = connection.ops.quote_name(spec.model._meta.db_table)
                quoted_pk = connection.ops.quote_name(spec.pk_db_column)
                with connection.cursor() as cursor:
                    cursor.execute(
                        f"SELECT setval(pg_get_serial_sequence(%s, %s), "
                        f"(SELECT MAX({quoted_pk}) FROM {quoted_table}))",
                        [spec.model._meta.db_table, spec.pk_db_column],
                    )

        return len(objects)
