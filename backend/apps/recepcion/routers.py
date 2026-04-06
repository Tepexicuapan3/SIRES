"""
apps/recepcion/routers.py
=========================

Router multi-DB para el módulo de citas médicas.

Reglas:
- Tablas legacy de expedientes   -> BD "expedientes" (solo lectura)
- Tablas legacy de catálogos     -> BD "default"     (solo lectura)
- Tablas nuevas managed de citas -> BD "default"     (lectura/escritura)
"""

# app_label de los modelos legacy/unmanaged (no cambia)
LEGACY_APP_LABEL = "citas_medicas"

# app_label de los modelos managed (cambiado a "recepcion")
MANAGED_APP_LABEL = "recepcion"

EXPEDIENTES_MODELS = {
    "catempleado",
    "catfamiliar",
    "dntfotocredencial",
    "catclinica",
}

SIRES_READONLY_MODELS = {
    "catturno",
    "catmedicoclin",
    "catconsultorio",
    "catcentroatencion",
}

SIRES_MANAGED_MODELS = {
    "citamedica",
    "citanotificacion",
    "horariodisponible",
}


class RecepcionCitasRouter:

    def db_for_read(self, model, **hints):
        label = model._meta.app_label
        name = model._meta.model_name

        if label == LEGACY_APP_LABEL:
            if name in EXPEDIENTES_MODELS:
                return "expedientes"
            if name in SIRES_READONLY_MODELS:
                return "default"
            return "default"

        if label == MANAGED_APP_LABEL and name in SIRES_MANAGED_MODELS:
            return "default"

        return None

    def db_for_write(self, model, **hints):
        label = model._meta.app_label
        name = model._meta.model_name

        if label == LEGACY_APP_LABEL:
            # legacy: nunca escribir
            return None

        if label == MANAGED_APP_LABEL and name in SIRES_MANAGED_MODELS:
            return "default"

        return None

    def allow_relation(self, obj1, obj2, **hints):
        labels = {obj1._meta.app_label, obj2._meta.app_label}
        if labels & {LEGACY_APP_LABEL, MANAGED_APP_LABEL}:
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        # Modelos managed (recepcion): solo en default
        if app_label == MANAGED_APP_LABEL:
            if not model_name:
                return None
            if model_name.lower() in SIRES_MANAGED_MODELS:
                return db == "default"
            return None

        # Modelos legacy (citas_medicas): nunca migrar
        if app_label == LEGACY_APP_LABEL:
            return False

        return None
