from apps.administracion.models import Modulo

# Misma red de seguridad de profundidad que GetNavigationMenuUseCase: el
# modelo ya impide (via Modulo.clean()) mas de MAX_DEPTH ancestros, pero se
# corta tambien aca ante datos cargados por fuera de full_clean().
_MAX_TREE_DEPTH = Modulo.MAX_DEPTH + 1


class ListModuleCatalogUseCase:
    """
    Arma el catalogo COMPLETO de modulos activos, sin la puerta de permiso
    ni la poda de contenedores vacios que aplica GetNavigationMenuUseCase.

    Este catalogo alimenta la UI de administracion de permisos por rol: el
    admin necesita ver TODOS los nodos (incluidos los que su propio rol no
    puede navegar) para poder tildar/destildar que permisos habilita cada
    uno.
    """

    def __init__(self, repository):
        self.repository = repository

    def execute(self, *, include_inactive=False):
        modules = self.repository.list_all_modules(include_inactive=include_inactive)

        children_by_parent = {}
        permissions_by_module = {}
        for modulo in modules:
            children_by_parent.setdefault(modulo.id_parent_id, []).append(modulo)
            permissions_by_module[modulo.id_modulo] = sorted(
                {relacion.id_permiso.codigo for relacion in modulo.permisos.all()}
            )

        def build_node(modulo, depth):
            original_children = children_by_parent.get(modulo.id_modulo, [])
            visible_children = []
            if original_children and depth < _MAX_TREE_DEPTH:
                visible_children = [
                    build_node(hijo, depth + 1) for hijo in original_children
                ]

            return {
                "modulo": modulo,
                "permissions": permissions_by_module.get(modulo.id_modulo, []),
                "items": visible_children,
            }

        roots = children_by_parent.get(None, [])
        return [build_node(root, depth=1) for root in roots]
