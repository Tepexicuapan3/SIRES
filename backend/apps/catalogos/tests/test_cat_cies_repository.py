from django.test import TestCase

from apps.catalogos.models import CatCies
from apps.catalogos.repositories.cat_cies_repository import CatCiesRepository


class CatCiesRepositoryTests(TestCase):
    def setUp(self):
        self.repository = CatCiesRepository()

    def test_bulk_upsert_creates_records_in_cat_cies(self):
        inserted = self.repository.bulk_upsert(
            [
                {
                    "CLAVE": "a001",
                    "DESCRIPCION": "fiebre viral",
                    "VERSION": "cie-10",
                },
                {
                    "CLAVE": "b002",
                    "DESCRIPCION": "gripe estacional",
                    "VERSION": "cie-10",
                },
            ],
            user_id=42,
        )

        self.assertEqual(inserted, 2)
        self.assertEqual(CatCies.objects.count(), 2)

        first = CatCies.objects.get(code="A001")
        self.assertEqual(first.description, "FIEBRE VIRAL")
        self.assertEqual(first.version, "CIE-10")
        self.assertEqual(first.created_by_id, 42)
        self.assertTrue(first.is_active)

    def test_bulk_upsert_updates_existing_record(self):
        CatCies.objects.create(
            code="C003",
            description="DESCRIPCION ORIGINAL",
            version="CIE-9",
            is_active=False,
            created_by_id=5,
        )

        inserted = self.repository.bulk_upsert(
            [
                {
                    "CLAVE": "c003",
                    "DESCRIPCION": "descripcion actualizada",
                    "VERSION": "cie-10",
                }
            ],
            user_id=99,
        )

        self.assertEqual(inserted, 1)

        updated = CatCies.objects.get(code="C003")
        self.assertEqual(updated.description, "DESCRIPCION ACTUALIZADA")
        self.assertEqual(updated.version, "CIE-10")
        self.assertTrue(updated.is_active)
        self.assertEqual(updated.updated_by_id, 99)
