from django.contrib.auth.hashers import make_password
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.administracion.models import (
    AuditoriaEvento,
    Modulo,
    ModuloPermiso,
    RelRolPermiso,
    RelUsuarioRol,
)
from apps.administracion.repositories.navigation_menu_repository import (
    NavigationMenuRepository,
)
from apps.administracion.repositories.navigation_module_mutation_repository import (
    NavigationModuleMutationRepository,
)
from apps.administracion.use_cases.navigation.create_module import CreateModuleUseCase
from apps.administracion.use_cases.navigation.exceptions import (
    NavigationModuleMoveInvalidError,
    NavigationModuleNotFoundError,
    NavigationModuleSystemProtectedError,
    NavigationModuleValidationError,
    NavigationPermissionGrantNotAllowedError,
    NavigationPermissionNotFoundError,
)
from apps.administracion.use_cases.navigation.hide_module import HideModuleUseCase
from apps.administracion.use_cases.navigation.move_module import MoveModuleUseCase
from apps.administracion.use_cases.navigation.reorder_module import ReorderModuleUseCase
from apps.administracion.use_cases.navigation.restore_module import RestoreModuleUseCase
from apps.administracion.use_cases.navigation.update_module import UpdateModuleUseCase
from apps.authentication.infrastructure.policy_store import PolicyStore
from apps.authentication.models import DetUsuario, SyUsuario
from apps.authentication.services.token_service import CSRF_COOKIE
from apps.catalogos.models import Permisos, Roles


def _make_actor(username, *, is_admin=False, permission_codes=None):
    user = SyUsuario.objects.create(
        usuario=username,
        correo=f"{username}@example.com",
        clave_hash=make_password("Clave_123456"),
        est_activo=True,
        cambiar_clave=False,
        terminos_acept=True,
    )
    DetUsuario.objects.create(id_usuario=user, nombre="Test", paterno="Actor", materno="")
    role = Roles.objects.create(
        rol=f"ROLE_{username}",
        desc_rol="Rol de prueba",
        landing_route="/x",
        is_admin=is_admin,
        is_active=True,
    )
    RelUsuarioRol.objects.create(id_usuario=user, id_rol=role, is_primary=True)
    for code in permission_codes or []:
        permiso, _ = Permisos.objects.get_or_create(
            codigo=code, defaults={"descripcion": code, "is_active": True}
        )
        RelRolPermiso.objects.create(id_rol=role, id_permiso=permiso)
    return user


class _UseCaseFixtureMixin:
    def setUp(self):
        self.read_repository = NavigationMenuRepository()
        self.mutation_repository = NavigationModuleMutationRepository()

        self.section = Modulo.objects.create(
            clave="farmacia", titulo="Farmacia", es_seccion=True, orden=10
        )
        self.panel = Modulo.objects.create(
            clave="farmacia.panel", titulo="Panel", id_parent=self.section, orden=10
        )
        self.sistema = Modulo.objects.create(
            clave="farmacia.sistema",
            titulo="Nodo de sistema",
            id_parent=self.section,
            es_sistema=True,
            orden=20,
        )
        self.sistema_hijo = Modulo.objects.create(
            clave="farmacia.sistema.hijo",
            titulo="Hijo de nodo de sistema",
            id_parent=self.sistema,
            orden=10,
        )


class CreateModuleUseCaseTests(_UseCaseFixtureMixin, TestCase):
    def _execute(self, data, *, actor=None):
        actor = actor or _make_actor("creator_admin", is_admin=True)
        return CreateModuleUseCase(self.read_repository, self.mutation_repository).execute(
            data=data, actor=actor
        )

    def test_creates_root_module_without_permissions(self):
        modulo = self._execute({"title": "Recetas", "isSection": False})

        self.assertEqual(modulo.clave, "recetas")
        # La fixture ya tiene 1 raiz ("farmacia") -> el nuevo nodo se
        # agrega al final del grupo: (1 hermano existente + 1) * 10 = 20.
        self.assertEqual(modulo.orden, 20)
        self.assertFalse(modulo.es_sistema)
        self.assertEqual(list(modulo.permisos.all()), [])

    def test_creates_child_module_with_derived_key_prefixed_by_parent(self):
        modulo = self._execute({"title": "Inventario", "parentKey": "farmacia.panel"})

        self.assertEqual(modulo.clave, "farmacia.panel.inventario")
        self.assertEqual(modulo.id_parent_id, self.panel.id_modulo)

    def test_key_collision_gets_anti_collision_suffix(self):
        actor = _make_actor("creator_admin_collision", is_admin=True)
        first = self._execute({"title": "Reporte", "parentKey": "farmacia.panel"}, actor=actor)
        second = self._execute({"title": "Reporte", "parentKey": "farmacia.panel"}, actor=actor)

        self.assertEqual(first.clave, "farmacia.panel.reporte")
        self.assertEqual(second.clave, "farmacia.panel.reporte_2")

    def test_missing_title_raises_validation_error(self):
        with self.assertRaises(NavigationModuleValidationError):
            self._execute({"title": "   "})

    def test_unknown_parent_key_raises_not_found(self):
        with self.assertRaises(NavigationModuleNotFoundError) as ctx:
            self._execute({"title": "Huerfano", "parentKey": "no.existe"})
        self.assertEqual(ctx.exception.details, {"parentKey": "no.existe"})

    def test_unknown_permission_code_raises_permission_not_found(self):
        """
        Cierra el criterio de "listo" de la tarea 8.2 ("codigo de permiso
        invalido -> 422"): `NavigationPermissionNotFoundError.status_code`
        es el HTTP real que la view devuelve (`exceptions.py`), no solo el
        tipo de excepcion.
        """
        with self.assertRaises(NavigationPermissionNotFoundError) as ctx:
            self._execute({"title": "Con permiso", "permissionCodes": ["no:existe:read"]})
        self.assertEqual(ctx.exception.status_code, 422)

    def test_permission_actor_does_not_own_raises_grant_not_allowed(self):
        Permisos.objects.create(
            codigo="farmacia:recetas:read", descripcion="Leer recetas", is_active=True
        )
        scoped_actor = _make_actor("creator_scoped", permission_codes=["admin:gestion:modulos:create"])

        with self.assertRaises(NavigationPermissionGrantNotAllowedError):
            self._execute(
                {"title": "Recetas", "permissionCodes": ["farmacia:recetas:read"]},
                actor=scoped_actor,
            )

    def test_permission_actor_owns_is_linked(self):
        Permisos.objects.create(
            codigo="farmacia:recetas:read", descripcion="Leer recetas", is_active=True
        )
        scoped_actor = _make_actor(
            "creator_scoped2",
            permission_codes=["admin:gestion:modulos:create", "farmacia:recetas:read"],
        )

        modulo = self._execute(
            {"title": "Recetas2", "permissionCodes": ["farmacia:recetas:read"]},
            actor=scoped_actor,
        )

        self.assertEqual(
            [rel.id_permiso.codigo for rel in modulo.permisos.all()],
            ["farmacia:recetas:read"],
        )

    def test_empty_permission_codes_allowed_unmanaged_node(self):
        modulo = self._execute({"title": "Publico", "permissionCodes": []})
        self.assertEqual(list(modulo.permisos.all()), [])


class UpdateModuleUseCaseTests(_UseCaseFixtureMixin, TestCase):
    def _execute(self, clave, data, *, actor=None):
        actor = actor or _make_actor("updater_admin", is_admin=True)
        return UpdateModuleUseCase(self.read_repository, self.mutation_repository).execute(
            clave=clave, data=data, actor=actor
        )

    def test_updates_simple_fields(self):
        modulo = self._execute(
            "farmacia.panel", {"title": "Panel renombrado", "icon": "pill", "isSection": True}
        )

        self.assertEqual(modulo.titulo, "Panel renombrado")
        self.assertEqual(modulo.icono, "pill")
        self.assertTrue(modulo.es_seccion)
        self.assertIsNotNone(modulo.fch_modf)

    def test_unknown_clave_raises_not_found(self):
        with self.assertRaises(NavigationModuleNotFoundError):
            self._execute("no.existe", {"title": "X"})

    def test_invalid_group_raises_validation_error(self):
        with self.assertRaises(NavigationModuleValidationError):
            self._execute("farmacia.panel", {"group": "invalido"})

    def test_replaces_permission_codes(self):
        permiso = Permisos.objects.create(
            codigo="farmacia:panel:read", descripcion="Leer panel", is_active=True
        )
        ModuloPermiso.objects.create(id_modulo=self.panel, id_permiso=permiso)

        nuevo_permiso = Permisos.objects.create(
            codigo="farmacia:panel:update", descripcion="Editar panel", is_active=True
        )
        modulo = self._execute(
            "farmacia.panel", {"permissionCodes": ["farmacia:panel:update"]}
        )

        codigos = sorted(rel.id_permiso.codigo for rel in modulo.permisos.all())
        self.assertEqual(codigos, ["farmacia:panel:update"])

    def test_permission_actor_does_not_own_raises_grant_not_allowed(self):
        Permisos.objects.create(
            codigo="farmacia:panel:read", descripcion="Leer panel", is_active=True
        )
        scoped_actor = _make_actor("updater_scoped", permission_codes=["admin:gestion:modulos:update"])

        with self.assertRaises(NavigationPermissionGrantNotAllowedError):
            self._execute(
                "farmacia.panel",
                {"permissionCodes": ["farmacia:panel:read"]},
                actor=scoped_actor,
            )


class HideModuleUseCaseTests(_UseCaseFixtureMixin, TestCase):
    def _execute(self, clave):
        return HideModuleUseCase(self.read_repository, self.mutation_repository).execute(
            clave=clave
        )

    def test_hides_non_system_leaf(self):
        modulo, affected_ids = self._execute("farmacia.panel")

        self.assertFalse(modulo.is_active)
        self.assertIsNotNone(modulo.fch_baja)
        self.assertIn(self.panel.id_modulo, affected_ids)

    def test_hiding_system_node_is_rejected(self):
        with self.assertRaises(NavigationModuleSystemProtectedError):
            self._execute("farmacia.sistema")

    def test_hiding_parent_of_system_descendant_is_rejected(self):
        """
        `farmacia` (la seccion) no es `es_sistema` en este fixture, pero
        tiene como descendiente a `farmacia.sistema` (es_sistema=True) --
        ocultarla debe rechazarse igual, porque de rebote esconderia al
        nodo protegido.
        """
        with self.assertRaises(NavigationModuleSystemProtectedError):
            self._execute("farmacia")

    def test_unknown_clave_raises_not_found(self):
        with self.assertRaises(NavigationModuleNotFoundError):
            self._execute("no.existe")


class RestoreModuleUseCaseTests(_UseCaseFixtureMixin, TestCase):
    def test_restores_hidden_module(self):
        HideModuleUseCase(self.read_repository, self.mutation_repository).execute(
            clave="farmacia.panel"
        )

        modulo = RestoreModuleUseCase(self.read_repository, self.mutation_repository).execute(
            clave="farmacia.panel"
        )

        self.assertTrue(modulo.is_active)
        self.assertIsNone(modulo.fch_baja)


class MoveModuleUseCaseTests(_UseCaseFixtureMixin, TestCase):
    def _execute(self, clave, new_parent_key):
        return MoveModuleUseCase(self.read_repository, self.mutation_repository).execute(
            clave=clave, new_parent_key=new_parent_key
        )

    def test_moves_node_to_new_valid_parent(self):
        otra_seccion = Modulo.objects.create(clave="almacen", titulo="Almacen", es_seccion=True)

        modulo = self._execute("farmacia.panel", "almacen")

        self.assertEqual(modulo.id_parent_id, otra_seccion.id_modulo)

    def test_moving_system_node_is_rejected(self):
        with self.assertRaises(NavigationModuleSystemProtectedError):
            self._execute("farmacia.sistema", None)

    def test_move_exceeding_max_depth_is_rejected(self):
        # farmacia (1) -> panel (2) -> hijo (3) -> nieto (4): mover "hijo"
        # (que ya tiene un descendiente propio) bajo "panel" empujaria a su
        # descendiente a nivel 5.
        hijo = Modulo.objects.create(clave="hijo_prof", titulo="Hijo", id_parent=self.panel)
        Modulo.objects.create(clave="hijo_prof.nieto", titulo="Nieto", id_parent=hijo)
        otro_padre = Modulo.objects.create(
            clave="farmacia.panel.otro", titulo="Otro", id_parent=self.panel
        )

        with self.assertRaises(NavigationModuleMoveInvalidError):
            self._execute("hijo_prof", "farmacia.panel.otro")

    def test_move_to_same_parent_is_noop(self):
        modulo = self._execute("farmacia.panel", "farmacia")
        self.assertEqual(modulo.id_parent_id, self.section.id_modulo)

    def test_move_to_unknown_parent_raises_not_found(self):
        with self.assertRaises(NavigationModuleNotFoundError):
            self._execute("farmacia.panel", "no.existe")

    def test_move_creating_cycle_is_rejected(self):
        with self.assertRaises(NavigationModuleMoveInvalidError):
            self._execute("farmacia.sistema.hijo", "farmacia.sistema.hijo")


class ReorderModuleUseCaseTests(_UseCaseFixtureMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.hijo_a = Modulo.objects.create(
            clave="farmacia.panel.a", titulo="A", id_parent=self.panel, orden=10
        )
        self.hijo_b = Modulo.objects.create(
            clave="farmacia.panel.b", titulo="B", id_parent=self.panel, orden=20
        )
        self.hijo_c = Modulo.objects.create(
            clave="farmacia.panel.c", titulo="C", id_parent=self.panel, orden=30
        )

    def _execute(self, parent_key, ordered_keys):
        return ReorderModuleUseCase(self.read_repository, self.mutation_repository).execute(
            parent_key=parent_key, ordered_keys=ordered_keys
        )

    def test_renumbers_siblings_by_ten(self):
        self._execute(
            "farmacia.panel",
            ["farmacia.panel.c", "farmacia.panel.a", "farmacia.panel.b"],
        )

        self.hijo_a.refresh_from_db()
        self.hijo_b.refresh_from_db()
        self.hijo_c.refresh_from_db()
        self.assertEqual(self.hijo_c.orden, 10)
        self.assertEqual(self.hijo_a.orden, 20)
        self.assertEqual(self.hijo_b.orden, 30)

    def test_reorder_is_idempotent(self):
        order = ["farmacia.panel.b", "farmacia.panel.c", "farmacia.panel.a"]
        self._execute("farmacia.panel", order)
        first_pass = list(
            Modulo.objects.filter(id_parent=self.panel).order_by("orden").values_list(
                "clave", flat=True
            )
        )

        self._execute("farmacia.panel", order)
        second_pass = list(
            Modulo.objects.filter(id_parent=self.panel).order_by("orden").values_list(
                "clave", flat=True
            )
        )

        self.assertEqual(first_pass, second_pass)
        self.assertEqual(first_pass, order)

    def test_mismatched_key_set_raises_validation_error(self):
        with self.assertRaises(NavigationModuleValidationError):
            self._execute("farmacia.panel", ["farmacia.panel.a", "farmacia.panel.b"])

    def test_unknown_parent_key_raises_not_found(self):
        with self.assertRaises(NavigationModuleNotFoundError):
            self._execute("no.existe", ["x"])


class NavigationModuleMutationViewsTests(APITestCase):
    """
    Integracion end-to-end de los 4 endpoints de escritura: 401 sin
    autenticacion, 403 sin permiso/CSRF, 200/201 en el camino feliz, y
    verificacion de que cada accion queda auditada.
    """

    def setUp(self):
        self.section = Modulo.objects.create(
            clave="farmacia", titulo="Farmacia", es_seccion=True, orden=10
        )
        self.panel = Modulo.objects.create(
            clave="farmacia.panel", titulo="Panel", id_parent=self.section, orden=10
        )
        self.sistema = Modulo.objects.create(
            clave="farmacia.sistema",
            titulo="Nodo de sistema",
            id_parent=self.section,
            es_sistema=True,
            orden=20,
        )

        self.admin = _make_actor("view_admin", is_admin=True)
        self.no_perm_actor = _make_actor("view_no_perm", permission_codes=[])

        PolicyStore().clear_active_session(self.admin.id_usuario)
        login_response = self.client.post(
            "/api/v1/auth/login",
            {"username": "view_admin", "password": "Clave_123456"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.client.cookies = login_response.cookies
        self.csrf_token = login_response.cookies.get(CSRF_COOKIE).value

    def _login_as(self, username):
        self.client.cookies.clear()
        user = SyUsuario.objects.get(usuario=username)
        PolicyStore().clear_active_session(user.id_usuario)
        response = self.client.post(
            "/api/v1/auth/login",
            {"username": username, "password": "Clave_123456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.cookies = response.cookies
        self.csrf_token = response.cookies.get(CSRF_COOKIE).value

    # -- POST /modules ----------------------------------------------------
    def test_create_module_success(self):
        response = self.client.post(
            "/api/v1/modules",
            {"title": "Recetas", "parentKey": "farmacia.panel"},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["key"], "farmacia.panel.recetas")

        event = AuditoriaEvento.objects.filter(accion="MODULE_CREATE").latest("id_evento")
        self.assertEqual(event.resultado, "SUCCESS")

    def test_create_module_requires_csrf(self):
        response = self.client.post(
            "/api/v1/modules", {"title": "Sin CSRF"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_module_requires_permission(self):
        self._login_as("view_no_perm")

        response = self.client.post(
            "/api/v1/modules",
            {"title": "Sin permiso"},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_module_requires_authentication(self):
        self.client.cookies.clear()

        response = self.client.post("/api/v1/modules", {"title": "X"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # -- GET /modules (colision de ruta con POST) --------------------------
    def test_get_modules_still_returns_catalog(self):
        response = self.client.get("/api/v1/modules")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("modules", response.data)

    # -- PATCH /modules/<clave> --------------------------------------------
    def test_update_module_success(self):
        response = self.client.patch(
            "/api/v1/modules/farmacia.panel",
            {"title": "Panel actualizado"},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["module"]["title"], "Panel actualizado")

        event = AuditoriaEvento.objects.filter(accion="MODULE_UPDATE").latest("id_evento")
        self.assertEqual(event.resultado, "SUCCESS")

    def test_update_module_requires_authentication(self):
        self.client.cookies.clear()

        response = self.client.patch(
            "/api/v1/modules/farmacia.panel", {"title": "X"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_module_requires_permission(self):
        self._login_as("view_no_perm")

        response = self.client.patch(
            "/api/v1/modules/farmacia.panel",
            {"title": "Sin permiso"},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_module_requires_csrf(self):
        response = self.client.patch(
            "/api/v1/modules/farmacia.panel", {"title": "Sin CSRF"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_module_moving_system_node_is_forbidden(self):
        response = self.client.patch(
            "/api/v1/modules/farmacia.sistema",
            {"parentKey": None},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "MODULE_SYSTEM_PROTECTED")

    def test_update_module_not_found(self):
        response = self.client.patch(
            "/api/v1/modules/no.existe",
            {"title": "X"},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # -- PATCH /modules/<clave>/visibility ---------------------------------
    def test_hide_module_requires_authentication(self):
        self.client.cookies.clear()

        response = self.client.patch(
            "/api/v1/modules/farmacia.panel/visibility",
            {"isActive": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_hide_module_requires_permission(self):
        self._login_as("view_no_perm")

        response = self.client.patch(
            "/api/v1/modules/farmacia.panel/visibility",
            {"isActive": False},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_hide_module_requires_csrf(self):
        response = self.client.patch(
            "/api/v1/modules/farmacia.panel/visibility",
            {"isActive": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_hide_and_restore_round_trip(self):
        hide_response = self.client.patch(
            "/api/v1/modules/farmacia.panel/visibility",
            {"isActive": False},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )
        self.assertEqual(hide_response.status_code, status.HTTP_200_OK)
        self.assertFalse(hide_response.data["module"]["isActive"])

        restore_response = self.client.patch(
            "/api/v1/modules/farmacia.panel/visibility",
            {"isActive": True},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )
        self.assertEqual(restore_response.status_code, status.HTTP_200_OK)
        self.assertTrue(restore_response.data["module"]["isActive"])

        hide_event = AuditoriaEvento.objects.filter(accion="MODULE_HIDE").latest("id_evento")
        self.assertEqual(hide_event.resultado, "SUCCESS")
        restore_event = AuditoriaEvento.objects.filter(accion="MODULE_RESTORE").latest(
            "id_evento"
        )
        self.assertEqual(restore_event.resultado, "SUCCESS")

    def test_hide_system_node_is_forbidden(self):
        response = self.client.patch(
            "/api/v1/modules/farmacia.sistema/visibility",
            {"isActive": False},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "MODULE_SYSTEM_PROTECTED")

    # -- PATCH /modules/reorder ---------------------------------------------
    def test_reorder_success(self):
        Modulo.objects.create(
            clave="farmacia.panel.a", titulo="A", id_parent=self.panel, orden=10
        )
        Modulo.objects.create(
            clave="farmacia.panel.b", titulo="B", id_parent=self.panel, orden=20
        )

        response = self.client.patch(
            "/api/v1/modules/reorder",
            {
                "parentKey": "farmacia.panel",
                "orderedKeys": ["farmacia.panel.b", "farmacia.panel.a"],
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [entry["key"] for entry in response.data["modules"]],
            ["farmacia.panel.b", "farmacia.panel.a"],
        )

        event = AuditoriaEvento.objects.filter(accion="MODULE_REORDER").latest("id_evento")
        self.assertEqual(event.resultado, "SUCCESS")

    def test_reorder_requires_csrf(self):
        response = self.client.patch(
            "/api/v1/modules/reorder",
            {"parentKey": "farmacia.panel", "orderedKeys": []},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reorder_requires_permission(self):
        self._login_as("view_no_perm")

        response = self.client.patch(
            "/api/v1/modules/reorder",
            {"parentKey": "farmacia.panel", "orderedKeys": []},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reorder_requires_authentication(self):
        self.client.cookies.clear()

        response = self.client.patch(
            "/api/v1/modules/reorder",
            {"parentKey": "farmacia.panel", "orderedKeys": []},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
