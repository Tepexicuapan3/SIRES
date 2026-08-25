import logging
import os
import sys

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class AdministracionConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.administracion"

    def ready(self):
        # Resincroniza el arbol de navegacion (cat_modulos) con el codigo
        # cada vez que arranca `runserver` en desarrollo local -- mismo
        # criterio que `start-docker.sh` usa para produccion (ver ese
        # archivo, corre los mismos dos comandos antes de lanzar daphne).
        # Sin esto, un modulo/ruta nuevo agregado a navigation_seed.py no
        # aparece en el sidebar hasta que alguien corre el comando a mano.
        #
        # Guards:
        # - Solo en `runserver` (no en migrate/test/shell/etc: las tablas
        #   pueden no existir todavia, o correrlo ahi no tiene sentido).
        # - RUN_MAIN=true evita que el autoreloader de runserver lo corra
        #   dos veces (una en el proceso watcher, otra en el real).
        if "runserver" not in sys.argv:
            return
        if os.environ.get("RUN_MAIN") != "true":
            return

        from django.core.management import call_command

        try:
            call_command("seed_navigation_permissions")
            call_command("seed_navigation_menu", "--prune")
        except Exception:
            logger.exception(
                "No se pudo resincronizar el arbol de navegacion al arrancar runserver"
            )
