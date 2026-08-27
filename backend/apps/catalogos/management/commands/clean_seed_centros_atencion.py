from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db.models import ProtectedError, RestrictedError

from apps.catalogos.models import CatCentroAtencion

# Codigos creados por seed_e2e.py (CENTER_DEFS). Solo corren si el arranque
# de docker tiene RUN_E2E_SEED_ON_BOOT=true (default false en
# docker-compose.local.yml) -- ver backend/start-docker.sh.
SEED_CENTER_CODES = (
    "CA-001",
    "HGR-002",
    "CLI-003",
    "SAN-004",
    "UMO-005",
    "URG-006",
    "ARC-007",
)


class Command(BaseCommand):
    help = (
        "Borra SOLO los centros de atencion demo creados por seed_e2e.py "
        "(CENTER_DEFS), identificados por su codigo (clues) exacto. No toca "
        "ningun centro capturado a mano. Por defecto corre en modo vista "
        "previa (no borra nada) -- pasa --confirm para ejecutar de verdad."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirm",
            action="store_true",
            help="Ejecuta el borrado de verdad. Sin esto, solo muestra que se borraria.",
        )

    def handle(self, *args, **options):
        confirm = options["confirm"]

        centers_qs = CatCentroAtencion.objects.filter(code__in=SEED_CENTER_CODES)
        found = sorted(centers_qs.values_list("code", "name"))

        self.stdout.write("=== Vista previa ===")
        if found:
            for code, name in found:
                self.stdout.write(f"  - {code}: {name}")
        else:
            self.stdout.write(
                self.style.WARNING(
                    "No se encontro ningun centro seed (codigos buscados: "
                    f"{', '.join(SEED_CENTER_CODES)}). No hay nada que borrar."
                )
            )
            return

        self.stdout.write(
            self.style.WARNING(
                "\nAtencion: 'centro_area_clinica' tiene CASCADE real -- si "
                "alguno de estos centros seed tiene areas clinicas asociadas, "
                "esas filas se borran junto con el centro."
            )
        )

        if not confirm:
            self.stdout.write(
                self.style.WARNING(
                    "\nModo vista previa -- no se borro nada. Corre con --confirm para ejecutar."
                )
            )
            return

        try:
            deleted_count, _ = centers_qs.delete()
        except (ProtectedError, RestrictedError) as exc:
            blocking_objects = list(exc.args[1]) if len(exc.args) > 1 else []
            self.stderr.write(
                self.style.ERROR(
                    "Borrado abortado (nada se toco): hay registros reales que "
                    "dependen de uno de estos centros seed (horarios, "
                    "excepciones, consultorios, autorizadores, almacenes, "
                    "inventario de vacunas o adscripciones de medicos). Revisa "
                    "esos registros antes de borrar ese centro puntual."
                )
            )
            for obj in blocking_objects[:20]:
                self.stderr.write(f"  - {obj!r}")
            return

        self.stdout.write(
            self.style.SUCCESS(f"\nBorrado OK: {deleted_count} fila(s) eliminada(s) en total.")
        )
