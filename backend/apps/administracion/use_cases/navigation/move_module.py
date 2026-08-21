from django.core.exceptions import ValidationError as DjangoValidationError

from apps.administracion.services.navigation_tree_validator import NavigationTreeValidator

from ...policies.navigation_module_mutation_policy import NavigationModuleMutationPolicy
from .exceptions import (
    NavigationModuleMoveInvalidError,
    NavigationModuleNotFoundError,
    NavigationModuleValidationError,
    details_from_validation_error,
)


class MoveModuleUseCase:
    """
    Unica responsabilidad: cambiar `id_parent`. Bloquea el move si el nodo
    es `es_sistema=True` (un nodo protegido no puede sacarse de su
    posicion), y delega en `NavigationTreeValidator` el chequeo de
    ciclo/profundidad del SUBARBOL completo del nodo (invariante que
    `Modulo.clean()` no cubre -- ver D2 del design).
    """

    def __init__(self, read_repository, mutation_repository):
        self.read_repository = read_repository
        self.mutation_repository = mutation_repository

    def execute(self, *, clave, new_parent_key):
        modulo = self.read_repository.get_by_clave(clave)
        if modulo is None:
            raise NavigationModuleNotFoundError(clave=clave)

        NavigationModuleMutationPolicy.assert_not_system(modulo)

        new_parent = None
        if new_parent_key is not None:
            new_parent = self.read_repository.get_by_clave(new_parent_key)
            if new_parent is None:
                raise NavigationModuleNotFoundError(clave=new_parent_key, field="parentKey")

        current_parent_key = modulo.id_parent.clave if modulo.id_parent_id else None
        if current_parent_key == new_parent_key:
            return modulo

        try:
            NavigationTreeValidator.validate_move(
                node_id=modulo.id_modulo,
                new_parent_id=new_parent.id_modulo if new_parent else None,
            )
        except DjangoValidationError as exc:
            raise NavigationModuleMoveInvalidError(
                "No se puede mover el modulo a esa posicion.",
                details=details_from_validation_error(exc),
            ) from exc

        try:
            self.mutation_repository.update_module(modulo, id_parent=new_parent)
        except DjangoValidationError as exc:
            raise NavigationModuleValidationError(details_from_validation_error(exc)) from exc

        return modulo
