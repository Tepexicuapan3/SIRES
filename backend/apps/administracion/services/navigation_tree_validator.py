from django.core.exceptions import ValidationError

from apps.administracion.models import Modulo


class NavigationTreeValidator:
    """
    Valida que mover un nodo (`node_id`) bajo un nuevo padre (`new_parent_id`)
    no viole los invariantes del arbol de navegacion: ciclos y profundidad
    maxima del SUBARBOL de descendientes.

    `Modulo.clean()` ya impide que la cadena de ANCESTROS de un nodo supere
    `MAX_DEPTH`, pero no camina hacia abajo: si el nodo movido tiene hijos,
    moverlo puede empujarlos mas alla de `MAX_DEPTH` sin que `clean()` lo
    detecte (solo mira hacia arriba desde `self`). Este validador cierra ese
    hueco y se invoca SOLO al mover un nodo (nunca en cada `save()`).

    Costo: 1 query (`values_list` de id/parent de TODOS los modulos, ~69
    filas) + calculo en memoria (ciclo + nivel + altura sobre un dict). No
    escala con el tamano del subarbol movido, solo con el tamano total del
    catalogo.

    Semantica de nivel (alineada con `Modulo.clean()` y el design D2):
    `level(raiz) = 1`. Formula validada:

        level(nuevo_padre) + 1 + height(subtree(nodo)) <= Modulo.MAX_DEPTH

    donde `level(None)` (mover a raiz) se trata como 0, de forma que el
    propio nodo movido queda en nivel `0 + 1 = 1`.
    """

    @staticmethod
    def _load_edges():
        """
        1 query: mapa completo `{id_modulo: id_parent_id}` de TODOS los
        modulos (activos e inactivos -- un nodo oculto puede seguir teniendo
        descendientes activos cuya profundidad importa).
        """
        return dict(Modulo.objects.values_list("id_modulo", "id_parent_id"))

    @staticmethod
    def _detect_cycle(edges, *, node_id, new_parent_id):
        """
        El nuevo padre no puede ser el propio nodo ni ninguno de sus
        descendientes actuales: eso formaria un ciclo. Se detecta subiendo
        por la cadena de ancestros de `new_parent_id` -- si se topa con
        `node_id`, es que `new_parent_id` vive dentro del subarbol de
        `node_id` HOY (antes del move).
        """
        if new_parent_id is None:
            return
        if new_parent_id == node_id:
            raise ValidationError(
                {"parentKey": "La jerarquia de modulos no puede formar un ciclo."}
            )

        visited = set()
        current = edges.get(new_parent_id)
        while current is not None:
            if current == node_id:
                raise ValidationError(
                    {"parentKey": "La jerarquia de modulos no puede formar un ciclo."}
                )
            if current in visited:
                # Ciclo preexistente ajeno a esta operacion -- no es el
                # invariante que este validador protege, se corta para no
                # entrar en loop infinito.
                break
            visited.add(current)
            current = edges.get(current)

    @staticmethod
    def _level_of(edges, module_id):
        """
        `level(raiz) = 1`. `level(None)` (posicion "sin padre") = 0, para
        que un nodo movido a raiz quede en `0 + 1 = 1`.
        """
        if module_id is None:
            return 0

        depth = 1
        seen = {module_id}
        current = edges.get(module_id)
        while current is not None:
            if current in seen:
                break
            seen.add(current)
            depth += 1
            current = edges.get(current)
        return depth

    @staticmethod
    def _height_of_subtree(edges, node_id):
        """
        Altura del subarbol de `node_id`: 0 si es hoja, 1 + altura maxima de
        sus hijos en caso contrario. Se arma un indice `parent -> [hijos]`
        una sola vez sobre el mismo `edges` ya cargado (sin query extra).
        """
        children_by_parent = {}
        for child_id, parent_id in edges.items():
            children_by_parent.setdefault(parent_id, []).append(child_id)

        def height(module_id, seen):
            if module_id in seen:
                # Ciclo preexistente ajeno: se corta para no recursar infinito.
                return 0
            seen = seen | {module_id}
            children = children_by_parent.get(module_id, [])
            if not children:
                return 0
            return 1 + max(height(child, seen) for child in children)

        return height(node_id, set())

    @classmethod
    def validate_move(cls, node_id, new_parent_id):
        """
        Levanta `django.core.exceptions.ValidationError` si mover `node_id`
        bajo `new_parent_id` (o a raiz, si es `None`) forma un ciclo o
        empuja algun descendiente mas alla de `Modulo.MAX_DEPTH`. No hace
        nada (retorna `None`) si el move es valido.
        """
        if node_id == new_parent_id:
            raise ValidationError(
                {"parentKey": "Un modulo no puede ser su propio padre."}
            )

        edges = cls._load_edges()

        cls._detect_cycle(edges, node_id=node_id, new_parent_id=new_parent_id)

        new_parent_level = cls._level_of(edges, new_parent_id)
        subtree_height = cls._height_of_subtree(edges, node_id)
        resulting_depth = new_parent_level + 1 + subtree_height

        if resulting_depth > Modulo.MAX_DEPTH:
            raise ValidationError(
                {
                    "parentKey": (
                        "Mover este modulo (y sus descendientes) superaria "
                        f"la profundidad maxima de {Modulo.MAX_DEPTH} niveles."
                    )
                }
            )
