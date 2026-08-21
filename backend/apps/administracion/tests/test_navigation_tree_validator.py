from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.administracion.models import Modulo
from apps.administracion.services.navigation_tree_validator import NavigationTreeValidator


class NavigationTreeValidatorTests(TestCase):
    """
    `NavigationTreeValidator.validate_move` cierra el hueco que
    `Modulo.clean()` deja abierto: `clean()` solo valida la cadena de
    ANCESTROS de `self`, nunca camina hacia abajo, asi que mover un nodo
    con hijos puede empujarlos mas alla de `MAX_DEPTH` sin que `clean()` lo
    note. Estos tests construyen los arboles directamente con
    `Modulo.objects.create()` (sin `full_clean()`) para poder armar
    fixtures de cualquier profundidad sin chocar con esa otra validacion.
    """

    @staticmethod
    def _make(clave, parent=None):
        return Modulo.objects.create(clave=clave, titulo=clave, id_parent=parent)

    def test_move_exceeds_max_depth_when_subtree_pushed_below_new_parent(self):
        """
        Caso motivador del bug que cierra este validador: mover un nodo con
        descendientes hasta profundidad 3 (node_x -> child_y -> grandchild_z,
        altura de subarbol = 2) bajo un padre que ya esta en nivel 2 excede
        MAX_DEPTH=4 -- level(child_b)=2 + 1 + height(2) = 5 > 4.
        """
        root_a = self._make("root_a")
        node_x = self._make("node_x", parent=root_a)
        child_y = self._make("node_x.child_y", parent=node_x)
        self._make("node_x.child_y.grandchild_z", parent=child_y)
        child_b = self._make("root_a.child_b", parent=root_a)

        with self.assertRaises(ValidationError) as ctx:
            NavigationTreeValidator.validate_move(
                node_id=node_x.id_modulo, new_parent_id=child_b.id_modulo
            )
        self.assertIn("parentKey", ctx.exception.message_dict)

    def test_move_valid_at_exact_max_depth_boundary(self):
        """
        Mismo padre en nivel 2, pero el subarbol movido tiene altura 1 (un
        solo nivel de hijos): 2 + 1 + 1 = 4 == MAX_DEPTH -> valido, NO
        levanta. Confirma que el limite es inclusivo (`<=`), no estricto.
        """
        self.assertEqual(Modulo.MAX_DEPTH, 4)

        root_a = self._make("root_a_boundary")
        node_x = self._make("node_x_boundary", parent=root_a)
        self._make("node_x_boundary.child", parent=node_x)
        child_b = self._make("root_a_boundary.child_b", parent=root_a)

        NavigationTreeValidator.validate_move(
            node_id=node_x.id_modulo, new_parent_id=child_b.id_modulo
        )

    def test_move_detects_cycle_when_new_parent_is_descendant(self):
        root_a = self._make("root_a3")
        node_x = self._make("node_x3", parent=root_a)
        child_y = self._make("node_x3.child_y3", parent=node_x)

        with self.assertRaises(ValidationError) as ctx:
            NavigationTreeValidator.validate_move(
                node_id=node_x.id_modulo, new_parent_id=child_y.id_modulo
            )
        self.assertIn("parentKey", ctx.exception.message_dict)

    def test_move_detects_self_as_own_parent(self):
        node_x = self._make("node_x4")

        with self.assertRaises(ValidationError):
            NavigationTreeValidator.validate_move(
                node_id=node_x.id_modulo, new_parent_id=node_x.id_modulo
            )

    def test_move_to_root_treats_new_parent_level_as_zero(self):
        """
        `level(None) = 0`: mover a raiz un nodo con altura de subarbol 2
        (node/child/grandchild) da 0 + 1 + 2 = 3 <= MAX_DEPTH(4) -> valido.
        """
        node_x = self._make("node_x5")
        child = self._make("node_x5.child", parent=node_x)
        self._make("node_x5.child.grandchild", parent=child)

        NavigationTreeValidator.validate_move(node_id=node_x.id_modulo, new_parent_id=None)

    def test_move_leaf_node_is_always_valid_when_within_depth(self):
        root_a = self._make("root_a6")
        leaf = self._make("root_a6.leaf", parent=root_a)
        child_b = self._make("root_a6.child_b", parent=root_a)

        NavigationTreeValidator.validate_move(
            node_id=leaf.id_modulo, new_parent_id=child_b.id_modulo
        )
