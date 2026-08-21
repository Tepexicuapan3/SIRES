from django.db.models import Prefetch

from apps.administracion.models import Modulo, ModuloPermiso


class NavigationMenuRepository:
    def list_active_modules(self):
        """
        Trae todos los modulos activos con su padre (join, sin query extra)
        y sus permisos asociados activos (1 query extra via prefetch).

        Total: 2 queries, sin importar el tamano del arbol.
        """
        return self.list_all_modules(include_inactive=False)

    def list_all_modules(self, *, include_inactive=False):
        """
        Igual que `list_active_modules`, pero `include_inactive=True` trae
        TAMBIEN los modulos ocultos (soft-deleted, `is_active=False`) -- lo
        usa el catalogo de administracion de menus (`?includeInactive=1`),
        nunca el sidebar ni la asignacion de permisos por rol.

        Total: 2 queries, sin importar el tamano del arbol.
        """
        queryset = Modulo.objects.all()
        if not include_inactive:
            queryset = queryset.filter(is_active=True)

        permisos_prefetch = Prefetch(
            "permisos",
            queryset=ModuloPermiso.objects.select_related("id_permiso").filter(
                id_permiso__is_active=True
            ),
        )

        return list(
            queryset.select_related("id_parent")
            .prefetch_related(permisos_prefetch)
            .order_by("orden", "titulo")
        )

    def get_by_clave(self, clave):
        """
        Busca un modulo por su `clave` unica (activo o no) con el padre
        pre-cargado (join, sin query extra). Devuelve `None` si no existe.
        """
        return Modulo.objects.select_related("id_parent").filter(clave=clave).first()

    def sibling_ids(self, parent_id, *, exclude_id=None):
        """
        Ids de los modulos ACTIVOS que comparten `id_parent=parent_id`
        (`None` = raiz), ordenados por `orden` actual. Lo usa
        `ReorderModuleUseCase` para validar que el conjunto de claves
        recibido coincide exactamente con los hermanos reales.
        """
        queryset = Modulo.objects.filter(id_parent_id=parent_id, is_active=True).order_by(
            "orden", "titulo"
        )
        if exclude_id is not None:
            queryset = queryset.exclude(id_modulo=exclude_id)
        return list(queryset.values_list("id_modulo", flat=True))

    def subtree_ids(self, node_id):
        """
        Ids de `node_id` y TODOS sus descendientes (activos e inactivos),
        1 query total: se carga el mapa completo `id -> id_parent` y se
        camina en memoria (misma tecnica que `NavigationTreeValidator`).
        Lo usa `HideModuleUseCase` para chequear `es_sistema` en cascada.
        """
        children_by_parent = {}
        for child_id, parent_id in Modulo.objects.values_list("id_modulo", "id_parent_id"):
            children_by_parent.setdefault(parent_id, []).append(child_id)

        result = []
        frontier = [node_id]
        while frontier:
            current = frontier.pop()
            result.append(current)
            frontier.extend(children_by_parent.get(current, []))
        return result

    def bulk_set_orden(self, pairs):
        """
        `pairs`: iterable de `(id_modulo, nuevo_orden)`. Actualiza `orden`
        en un solo `bulk_update` (1 query de lectura + 1 de escritura, sin
        importar cuantos hermanos se renumeren). Solo toca las filas cuyo
        `orden` realmente cambia -- lo usa `ReorderModuleUseCase`.
        """
        pairs = list(pairs)
        ids = [module_id for module_id, _ in pairs]
        modulos_by_id = {m.id_modulo: m for m in Modulo.objects.filter(id_modulo__in=ids)}

        updated = []
        for module_id, orden in pairs:
            modulo = modulos_by_id[module_id]
            if modulo.orden != orden:
                modulo.orden = orden
                updated.append(modulo)

        if updated:
            Modulo.objects.bulk_update(updated, ["orden"])
        return updated
