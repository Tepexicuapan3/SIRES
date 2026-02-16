from django.apps import AppConfig
from django.contrib.auth.management import create_permissions
from django.contrib.contenttypes.management import create_contenttypes
from django.db.models.signals import post_migrate


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"

    def ready(self):
        # Evita crear tablas/entries de auth y contenttypes.
        post_migrate.disconnect(create_permissions)
        post_migrate.disconnect(create_contenttypes)
