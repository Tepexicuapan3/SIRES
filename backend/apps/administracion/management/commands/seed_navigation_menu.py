from __future__ import annotations

import logging

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.administracion.management.seeds.navigation_seed import (
    CLAVES_SISTEMA,
    NAV_SEED,
)
from apps.administracion.models import Modulo, ModuloPermiso
from apps.catalogos.models import Permisos

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        "Siembra el catalogo de modulos de navegacion (cat_modulos) desde la "
        "transcripcion congelada de nav-config.ts en "
        "management/seeds/navigation_seed.py. Idempotente: correrlo N veces "
        "produce el mismo estado final (mismo conteo de filas)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="No escribe en la base de datos, solo reporta que haria.",
        )
        parser.add_argument(
            "--prune",
            action="store_true",
            help=(
                "Desactiva (is_active=False, soft-delete) los modulos "
                "sembrados previamente cuya clave ya no esta en "
                "navigation_seed.py. Sin este flag, los modulos obsoletos "
                "se dejan tal cual (no se tocan)."
            ),
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        prune = options["prune"]

        with transaction.atomic():
            summary = self._run(dry_run=dry_run, prune=prune)
            if dry_run:
                transaction.set_rollback(True)

        self._report(summary, dry_run=dry_run)

    # ------------------------------------------------------------------
    def _run(self, *, dry_run: bool, prune: bool) -> dict:
        seed_claves = {entry["clave"] for entry in NAV_SEED}

        created = 0
        updated = 0
        pruned = 0
        permisos_asociados = 0
        permisos_removidos = 0
        codigos_huerfanos: set[str] = set()

        # Paso 1: crear/actualizar cada nodo SIN resolver parent_clave
        # todavia, para no depender del orden de aparicion en NAV_SEED
        # (un hijo puede listarse antes o despues de su padre).
        modulos_por_clave: dict[str, Modulo] = {}
        for entry in NAV_SEED:
            es_sistema = entry["clave"] in CLAVES_SISTEMA
            modulo, fue_creado = Modulo.objects.get_or_create(
                clave=entry["clave"],
                defaults={
                    "titulo": entry["titulo"],
                    "icono": entry["icono"],
                    "url": entry["url"],
                    "badge": entry["badge"],
                    "orden": entry["orden"],
                    "es_seccion": entry["es_seccion"],
                    "es_sistema": es_sistema,
                    "grupo": entry["grupo"],
                    "is_active": True,
                },
            )
            if fue_creado:
                created += 1
            else:
                campos_deseados = {
                    "titulo": entry["titulo"],
                    "icono": entry["icono"],
                    "url": entry["url"],
                    "badge": entry["badge"],
                    "orden": entry["orden"],
                    "es_seccion": entry["es_seccion"],
                    "es_sistema": es_sistema,
                    "grupo": entry["grupo"],
                    "is_active": True,
                }
                cambio = False
                for campo, valor in campos_deseados.items():
                    if getattr(modulo, campo) != valor:
                        setattr(modulo, campo, valor)
                        cambio = True
                if cambio:
                    if modulo.fch_baja is not None:
                        modulo.fch_baja = None
                    modulo.fch_modf = timezone.now()
                    modulo.full_clean(exclude=["id_parent"])
                    modulo.save()
                    updated += 1
            modulos_por_clave[entry["clave"]] = modulo

        # Paso 2: resolver parent_clave -> id_parent ahora que todos los
        # nodos del seed existen en BD.
        for entry in NAV_SEED:
            modulo = modulos_por_clave[entry["clave"]]
            parent_clave = entry["parent_clave"]
            nuevo_parent = modulos_por_clave[parent_clave] if parent_clave else None
            nuevo_parent_id = nuevo_parent.id_modulo if nuevo_parent else None
            if modulo.id_parent_id != nuevo_parent_id:
                modulo.id_parent = nuevo_parent
                modulo.full_clean()
                modulo.save(update_fields=["id_parent"])

        # Paso 3: asociar permisos por codigo. Un codigo sin match en
        # catalogos.Permisos se loguea como warning y se OMITE (nunca se
        # crea el permiso). Tambien se sincroniza: si un permiso fue
        # quitado del seed para un modulo, se borra la asociacion vieja.
        for entry in NAV_SEED:
            modulo = modulos_por_clave[entry["clave"]]
            codigos = entry["permisos"]

            permisos_encontrados = (
                list(Permisos.objects.filter(codigo__in=codigos)) if codigos else []
            )
            permisos_por_codigo = {p.codigo: p for p in permisos_encontrados}

            for codigo in codigos:
                if codigo not in permisos_por_codigo:
                    codigos_huerfanos.add(codigo)
                    mensaje = (
                        f"código huérfano: {codigo}, módulo {entry['clave']} "
                        "no tendrá ese permiso asociado"
                    )
                    logger.warning(mensaje)
                    self.stdout.write(
                        self.style.WARNING(f"[seed_navigation_menu] {mensaje}")
                    )

            ids_deseados = {p.id_permiso for p in permisos_por_codigo.values()}

            for permiso in permisos_por_codigo.values():
                _, fue_creado = ModuloPermiso.objects.get_or_create(
                    id_modulo=modulo, id_permiso=permiso
                )
                if fue_creado:
                    permisos_asociados += 1

            obsoletos = ModuloPermiso.objects.filter(id_modulo=modulo).exclude(
                id_permiso_id__in=ids_deseados
            )
            permisos_removidos += obsoletos.count()
            obsoletos.delete()

        # Paso 4 (opcional, --prune): baja logica de modulos sembrados que
        # ya no estan en el seed. Soft-delete (is_active=False) para no
        # romper FKs (rel_modulo_permisos CASCADE, hijos PROTECT).
        if prune:
            obsoletos_qs = Modulo.objects.filter(is_active=True).exclude(
                clave__in=seed_claves
            )
            for modulo in obsoletos_qs:
                modulo.is_active = False
                modulo.fch_baja = timezone.now()
                modulo.save(update_fields=["is_active", "fch_baja"])
                pruned += 1

        return {
            "total_nodos": len(NAV_SEED),
            "created": created,
            "updated": updated,
            "pruned": pruned,
            "permisos_asociados": permisos_asociados,
            "permisos_removidos": permisos_removidos,
            "codigos_huerfanos": sorted(codigos_huerfanos),
        }

    # ------------------------------------------------------------------
    def _report(self, summary: dict, *, dry_run: bool) -> None:
        prefijo = "[DRY-RUN] " if dry_run else ""
        self.stdout.write(
            self.style.SUCCESS(
                f"{prefijo}[seed_navigation_menu] nodos={summary['total_nodos']} "
                f"creados={summary['created']} actualizados={summary['updated']} "
                f"desactivados={summary['pruned']} "
                f"permisos_asociados={summary['permisos_asociados']} "
                f"permisos_removidos={summary['permisos_removidos']} "
                f"codigos_huerfanos={len(summary['codigos_huerfanos'])}"
            )
        )
        if summary["codigos_huerfanos"]:
            self.stdout.write(
                self.style.WARNING(
                    "[seed_navigation_menu] codigos huerfanos: "
                    + ", ".join(summary["codigos_huerfanos"])
                )
            )
