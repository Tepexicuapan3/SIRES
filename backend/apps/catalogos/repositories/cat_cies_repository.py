from apps.catalogos.models.cies import CatCies
from django.utils import timezone


class CatCiesRepository:

    def bulk_upsert(self, records: list[dict], user_id: int) -> int:
        now = timezone.now()
        count = 0

        for r in records:
            obj, created = CatCies.objects.get_or_create(
                code=r["CLAVE"].upper(),
                defaults={
                    "description": r["DESCRIPCION"].upper(),
                    "version": r["VERSION"].upper(),
                    "is_active": True,
                    "created_by_id": user_id,
                    "created_at": now,
                }
            )

            if not created:
                obj.description = r["DESCRIPCION"].upper()
                obj.version = r["VERSION"].upper()
                obj.is_active = True
                obj.updated_by_id = user_id
                obj.updated_at = now
                obj.save(
                    update_fields=[
                        "description",
                        "version",
                        "is_active",
                        "updated_by_id",
                        "updated_at",
                    ]
                )

            count += 1

        return count
