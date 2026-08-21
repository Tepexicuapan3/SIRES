from django.contrib import admin

from .models.modulo import Modulo
from .models.modulo_permiso import ModuloPermiso


class ModuloPermisoInline(admin.TabularInline):
    model = ModuloPermiso
    fk_name = "id_modulo"
    extra = 1
    raw_id_fields = ("id_permiso",)


@admin.register(Modulo)
class ModuloAdmin(admin.ModelAdmin):
    list_display = (
        "id_modulo",
        "clave",
        "titulo",
        "grupo",
        "es_seccion",
        "orden",
        "id_parent",
        "is_active",
    )
    list_filter = ("grupo", "es_seccion", "is_active")
    search_fields = ("clave", "titulo")
    ordering = ("orden", "titulo")
    autocomplete_fields = ("id_parent",)
    inlines = (ModuloPermisoInline,)
