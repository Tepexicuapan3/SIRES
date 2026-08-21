from .exceptions import NavigationModuleNotFoundError


class RestoreModuleUseCase:
    """
    Reversa de `HideModuleUseCase`: `is_active=True`, limpia `fch_baja`. No
    hay guarda de `es_sistema` -- restaurar (des-ocultar) nunca puede
    autobloquear a nadie, a diferencia de ocultar/mover.
    """

    def __init__(self, read_repository, mutation_repository):
        self.read_repository = read_repository
        self.mutation_repository = mutation_repository

    def execute(self, *, clave):
        modulo = self.read_repository.get_by_clave(clave)
        if modulo is None:
            raise NavigationModuleNotFoundError(clave=clave)

        self.mutation_repository.restore_module(modulo)
        return modulo
