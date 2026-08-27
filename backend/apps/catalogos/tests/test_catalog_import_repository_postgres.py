"""
Postgres-only regression test for `CatalogImportRepository.bulk_insert`
(see `apps/catalogos/repositories/catalog_import_repository.py`).

`bulk_create` bypasses `Model.save()`, so on Postgres the serial sequence
backing the PK never advances on its own when rows are inserted with
explicit IDs. The repository compensates with an advisory lock + `setval`
guarded by `connection.vendor == "postgresql"`.

This project's test DB is sqlite `:memory:` under `manage.py test` (see
`config/settings.py`, `if "test" in sys.argv`) and uses Django's own test
runner, not pytest -- there is no `pytest.mark.postgres` marker mechanism
here, and no existing precedent in this repo for a custom Postgres-only
test tag. `unittest.skipUnless` tied to `connection.vendor` is Django's
own built-in mechanism for this: the test SKIPS (not fails, not errors)
whenever it runs against sqlite, which is the correct/expected outcome
for the default `manage.py test` run.
"""

import unittest

from django.db import connection
from django.test import TestCase

from apps.catalogos.imports.registry import CATALOG_IMPORT_REGISTRY
from apps.catalogos.models import Especialidades
from apps.catalogos.repositories.catalog_import_repository import CatalogImportRepository

SPECIALTIES_SPEC = CATALOG_IMPORT_REGISTRY["specialties"]


@unittest.skipUnless(connection.vendor == "postgresql", "requires Postgres")
class BulkInsertAdvancesSequenceTests(TestCase):
    """Only exercised in CI/environments running the real Postgres test DB.
    Under the default sqlite `:memory:` run this class is skipped entirely
    (no test methods execute), which is the intended behavior."""

    def test_normal_create_after_bulk_insert_does_not_collide_with_explicit_ids(self):
        repository = CatalogImportRepository()
        given_ids = [1, 2, 3, 7, 8, 15, 16, 20]
        records = [{"id": i, "name": f"Especialidad {i}", "is_active": True} for i in given_ids]

        inserted = repository.bulk_insert(SPECIALTIES_SPEC, records, user_id=1)

        self.assertEqual(inserted, len(given_ids))

        # Sin el setval, la secuencia de Postgres seguiria en su valor
        # original y el proximo create() (sin ID explicito, via CRUD normal)
        # chocaria contra un ID ya insertado por el bulk_insert de arriba.
        created = Especialidades.objects.create(name="Especialidad nueva")

        self.assertGreater(created.id, max(given_ids))
