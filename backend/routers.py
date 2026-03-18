MODELOS_EXPEDIENTES = {'catempLeado', 'catfamiliar', 'dntfotoscredenciales'}


class ExpedientesRouter:

    def db_for_read(self, model, **hints):
        if model.__name__.lower() in MODELOS_EXPEDIENTES:
            return 'expedientes'
        return 'default'

    def db_for_write(self, model, **hints):
        if model.__name__.lower() in MODELOS_EXPEDIENTES:
            return 'expedientes'
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if model_name and model_name.lower() in MODELOS_EXPEDIENTES:
            return db == 'expedientes'
        return db == 'default'