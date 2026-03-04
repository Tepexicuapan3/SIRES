'''from apps.catalogos.models import Enfermedades


class CatCiesRepository:

    def bulk_upsert(self, records: list[dict]) -> int:
        """
        Inserta o actualiza registros válidos en CatCies.
        Compatible con MySQL.
        Devuelve la cantidad de registros procesados.
        """
        count = 0

        for r in records:
            Enfermedades.objects.update_or_create(
                code=r["CLAVE"].upper(),
                defaults={
                    "description": r["DESCRIPCION"].upper(),
                    "version": r["VERSION"].upper(),
                    "is_active": True,
                },
            )
            count += 1

        return count

    def list_all(self):
        return Enfermedades.objects.all()

    def get_by_code(self, code: str) -> Enfermedades:
        return Enfermedades.objects.get(code=code.upper())

    def delete(self, code: str) -> None:
        Enfermedades.objects.filter(code=code.upper()).delete()'''

'''from apps.catalogos.models import Enfermedades
from django.utils import timezone

class CatCiesRepository:

    def bulk_upsert(self, records: list[dict], user_id: int) -> int:
        count = 0
        now = timezone.now()

        for r in records:
            # Campos principales
            defaults = {
                "name": r["DESCRIPCION"].upper(),
                "cie_version": r["VERSION"].upper(),
                "est_activo": 1,
                "usr_alta": user_id,
                "fch_alta": now,
            }

            # update_or_create
            Enfermedades.objects.update_or_create(
                code=r["CLAVE"].upper(),
                defaults=defaults
            )
            count += 1

        return count'''

from apps.catalogos.models import Enfermedades
from django.utils import timezone


class CatCiesRepository:

    def bulk_upsert(self, records: list[dict], user_id: int) -> int:
        now = timezone.now()
        count = 0

        for r in records:
            obj, created = Enfermedades.objects.get_or_create(
                code=r["CLAVE"].upper(),
                defaults={
                    "name": r["DESCRIPCION"].upper(),
                    "cie_version": r["VERSION"].upper(),
                    "is_active": True,
                    "created_by_id": user_id,
                    "created_at": now,
                }
            )

            if not created:
                obj.name = r["DESCRIPCION"].upper()
                obj.cie_version = r["VERSION"].upper()
                obj.updated_by_id = user_id
                obj.updated_at = now
                obj.save()

            count += 1

        return count