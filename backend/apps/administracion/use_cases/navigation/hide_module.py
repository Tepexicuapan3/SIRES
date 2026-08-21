from apps.administracion.models import Modulo

from ...policies.navigation_module_mutation_policy import NavigationModuleMutationPolicy
from .exceptions import NavigationModuleNotFoundError, NavigationModuleSystemProtectedError


class HideModuleUseCase:
    """
    Soft-delete (`is_active=False`) -- NUNCA `DELETE` real (la FK
    `id_parent` es `PROTECT`, y ocultar/restaurar debe ser reversible).

    Bloquea la operacion si el nodo (o CUALQUIERA de sus descendientes,
    ocultos o no) es `es_sistema=True`: ocultar un contenedor no debe poder
    esconder de rebote un nodo protegido (ej. ocultar "Administracion"
    escondería "Roles"/"Usuarios" aunque esos dos nodos en si nunca se
    tocan). El chequeo es sobre el SUBARBOL completo, no solo el nodo
    objetivo.
    """

    def __init__(self, read_repository, mutation_repository):
        self.read_repository = read_repository
        self.mutation_repository = mutation_repository

    def execute(self, *, clave):
        modulo = self.read_repository.get_by_clave(clave)
        if modulo is None:
            raise NavigationModuleNotFoundError(clave=clave)

        affected_ids = self.read_repository.subtree_ids(modulo.id_modulo)
        protected = Modulo.objects.filter(
            id_modulo__in=affected_ids, es_sistema=True
        ).first()
        if protected is not None:
            NavigationModuleMutationPolicy.assert_not_system(protected)

        self.mutation_repository.hide_module(modulo)
        return modulo, affected_ids
