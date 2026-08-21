from apps.administracion.models import Modulo

from .exceptions import NavigationModuleNotFoundError, NavigationModuleValidationError

_ORDEN_STEP = 10


class ReorderModuleUseCase:
    """
    Renumera TODO el grupo de hermanos (10, 20, 30...) en vez de swap de a
    pares -- idempotente: correrlo dos veces con el mismo `orderedKeys`
    produce el mismo resultado, y una corrida parcial previa nunca deja
    valores de `orden` "entre medio" inconsistentes.
    """

    def __init__(self, read_repository, mutation_repository):
        self.read_repository = read_repository
        self.mutation_repository = mutation_repository

    def execute(self, *, parent_key, ordered_keys):
        ordered_keys = list(ordered_keys or [])
        if not ordered_keys:
            raise NavigationModuleValidationError(
                {"orderedKeys": ["Debe incluir al menos una clave"]}
            )
        if len(ordered_keys) != len(set(ordered_keys)):
            raise NavigationModuleValidationError(
                {"orderedKeys": ["No puede tener claves repetidas"]}
            )

        parent = None
        if parent_key is not None:
            parent = self.read_repository.get_by_clave(parent_key)
            if parent is None:
                raise NavigationModuleNotFoundError(clave=parent_key, field="parentKey")

        parent_id = parent.id_modulo if parent else None
        actual_sibling_ids = set(self.read_repository.sibling_ids(parent_id))

        claves_a_ids = dict(
            Modulo.objects.filter(clave__in=ordered_keys, is_active=True).values_list(
                "clave", "id_modulo"
            )
        )
        requested_ids = {claves_a_ids[clave] for clave in ordered_keys if clave in claves_a_ids}

        missing_claves = [clave for clave in ordered_keys if clave not in claves_a_ids]
        if missing_claves or requested_ids != actual_sibling_ids:
            raise NavigationModuleValidationError(
                {
                    "orderedKeys": [
                        "El conjunto de claves no coincide exactamente con "
                        "los hermanos actuales de ese padre."
                    ]
                }
            )

        pairs = [
            (claves_a_ids[clave], (index + 1) * _ORDEN_STEP)
            for index, clave in enumerate(ordered_keys)
        ]
        self.read_repository.bulk_set_orden(pairs)

        return [
            {"key": clave, "orden": (index + 1) * _ORDEN_STEP}
            for index, clave in enumerate(ordered_keys)
        ]
