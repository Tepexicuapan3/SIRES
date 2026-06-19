from django.apps import AppConfig


class AlmacenInsumosConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name               = "apps.almacen_insumos"
    verbose_name       = "Almacén de Insumos"

    def ready(self):
        import apps.almacen_insumos.signals  # noqa: F401
