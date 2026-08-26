from __future__ import annotations

import logging

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.administracion.management.seeds.catalogos_crud_permissions_seed import (
    CATALOGOS_CRUD_PERMISSIONS_SEED,
)
from apps.administracion.models import RelRolPermiso
from apps.catalogos.models import Permisos, Roles

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        "Da de alta (idempotente) los permisos create/update/delete de los "
        "catalogos migrados a CRUD completo (change catalogos-crud) y los "
        "asigna a los roles con is_admin=True. Sin esto, permission_dependencies.py "
        "mapea la capability pero el permiso no existe como fila real en "
        "cat_permisos ni esta asignado a ningun rol, asi que hasCapability "
        "sigue bloqueando los botones de crear/editar/eliminar."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="No escribe en la base de datos, solo reporta que haria.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        with transaction.atomic():
            summary = self._run()
            if dry_run:
                transaction.set_rollback(True)

        self._report(summary, dry_run=dry_run)

    # ------------------------------------------------------------------
    def _run(self) -> dict:
        permisos_creados = 0
        permisos_actualizados = 0
        asignaciones_creadas = 0

        admin_roles = list(Roles.objects.filter(is_admin=True, is_active=True))

        for codigo, descripcion in CATALOGOS_CRUD_PERMISSIONS_SEED:
            permiso, fue_creado = Permisos.objects.get_or_create(
                codigo=codigo,
                defaults={
                    "descripcion": descripcion,
                    "is_active": True,
                    "es_sistema": False,
                    "updated_at": timezone.now(),
                },
            )

            if fue_creado:
                permisos_creados += 1
            else:
                cambio = False
                if permiso.descripcion != descripcion:
                    permiso.descripcion = descripcion
                    cambio = True
                if not permiso.is_active:
                    permiso.is_active = True
                    cambio = True
                if cambio:
                    permiso.updated_at = timezone.now()
                    permiso.save(update_fields=["descripcion", "is_active", "updated_at"])
                    permisos_actualizados += 1

            for rol in admin_roles:
                _, fue_asignado = RelRolPermiso.objects.get_or_create(
                    id_rol=rol,
                    id_permiso=permiso,
                    defaults={"fch_baja": None},
                )
                if fue_asignado:
                    asignaciones_creadas += 1

        return {
            "total": len(CATALOGOS_CRUD_PERMISSIONS_SEED),
            "permisos_creados": permisos_creados,
            "permisos_actualizados": permisos_actualizados,
            "asignaciones_creadas": asignaciones_creadas,
            "roles_admin": [rol.rol for rol in admin_roles],
        }

    # ------------------------------------------------------------------
    def _report(self, summary: dict, *, dry_run: bool) -> None:
        prefijo = "[DRY-RUN] " if dry_run else ""
        self.stdout.write(
            self.style.SUCCESS(
                f"{prefijo}[seed_catalogos_crud_permissions] total={summary['total']} "
                f"permisos_creados={summary['permisos_creados']} "
                f"permisos_actualizados={summary['permisos_actualizados']} "
                f"asignaciones_creadas={summary['asignaciones_creadas']} "
                f"roles_admin={summary['roles_admin']}"
            )
        )
