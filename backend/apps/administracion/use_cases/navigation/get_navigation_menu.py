from apps.administracion.models import Modulo
from apps.administracion.services.rbac_resolver import RBACResolver

# El modelo ya impide (via Modulo.clean()) crear jerarquias de mas de
# MAX_DEPTH ancestros, pero el arbol tambien se corta aca como red de
# seguridad ante datos cargados por fuera de full_clean() (ej. un
# queryset.update() crudo).
_MAX_TREE_DEPTH = Modulo.MAX_DEPTH + 1


class GetNavigationMenuUseCase:
    def __init__(self, repository):
        self.repository = repository

    def execute(self, *, usuario):
        effective_permissions = set(RBACResolver.get_effective_permissions(usuario))
        has_wildcard = "*" in effective_permissions

        modules = self.repository.list_active_modules()

        children_by_parent = {}
        permissions_by_module = {}
        for modulo in modules:
            children_by_parent.setdefault(modulo.id_parent_id, []).append(modulo)
            permissions_by_module[modulo.id_modulo] = sorted(
                {relacion.id_permiso.codigo for relacion in modulo.permisos.all()}
            )

        def build_node(modulo, depth):
            own_permissions = permissions_by_module.get(modulo.id_modulo, [])

            # Puerta de permiso: solo se evalua si el modulo declara
            # permisos propios. Sin permisos declarados = publico (pasa
            # siempre), igual que filterNavItem en el frontend. Con
            # permisos declarados, semantica OR: alcanza con uno.
            if (
                not has_wildcard
                and own_permissions
                and not any(
                    codigo in effective_permissions for codigo in own_permissions
                )
            ):
                return None

            original_children = children_by_parent.get(modulo.id_modulo, [])
            visible_children = []
            if original_children and depth < _MAX_TREE_DEPTH:
                for hijo in original_children:
                    child_node = build_node(hijo, depth + 1)
                    if child_node is not None:
                        visible_children.append(child_node)

            if original_children:
                # Contenedor (tenia hijos antes de podar): se oculta si
                # quedo vacio, salvo que sea un item (no seccion) con url
                # propia navegable — igual que filterNavigation.ts.
                keeps_by_own_url = (not modulo.es_seccion) and bool(modulo.url)
                if not visible_children and not keeps_by_own_url:
                    return None

            return {
                "modulo": modulo,
                "permissions": own_permissions,
                "items": visible_children,
            }

        roots = children_by_parent.get(None, [])
        tree = []
        for root in roots:
            node = build_node(root, depth=1)
            if node is not None:
                tree.append(node)
        return tree
