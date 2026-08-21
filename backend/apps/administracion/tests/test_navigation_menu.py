from django.contrib.auth.hashers import make_password
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.administracion.management.seeds.navigation_seed import NAV_SEED
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
from apps.administracion.services.navigation_menu_serializers import (
    serialize_module_catalog,
)
from apps.administracion.use_cases.navigation.get_navigation_menu import (
    GetNavigationMenuUseCase,
)
from apps.administracion.use_cases.navigation.list_module_catalog import (
    ListModuleCatalogUseCase,
)
from apps.authentication.infrastructure.policy_store import PolicyStore
from apps.authentication.models import DetUsuario, SyUsuario
from apps.authentication.services.token_service import CSRF_COOKIE
from apps.catalogos.models import Permisos, Roles


def _flatten_claves(tree):
    claves = set()

    def walk(nodes):
        for node in nodes:
            claves.add(node["modulo"].clave)
            walk(node["items"])

    walk(tree)
    return claves


def _find_node(tree, clave):
    for node in tree:
        if node["modulo"].clave == clave:
            return node
        found = _find_node(node["items"], clave)
        if found is not None:
            return found
    return None


class _NavigationTreeFixtureMixin:
    """
    Fixture compartida entre los tests de `GetNavigationMenuUseCase` (poda
    por permiso del actor) y `ListModuleCatalogUseCase` (catalogo completo,
    sin poda): mismo arbol, mismos permisos declarados.
    """

    def setUp(self):
        self.repository = NavigationMenuRepository()

        self.section = Modulo.objects.create(
            clave="administracion",
            titulo="Administracion",
            es_seccion=True,
            grupo=Modulo.Grupo.PRIMARY,
            orden=1,
        )
        self.panel = Modulo.objects.create(
            clave="administracion.panel",
            titulo="Panel",
            id_parent=self.section,
            orden=1,
        )
        self.usuarios = Modulo.objects.create(
            clave="administracion.panel.usuarios",
            titulo="Usuarios",
            id_parent=self.panel,
            url="/admin/usuarios",
            orden=1,
        )
        self._link_permission(self.usuarios, "admin:gestion:usuarios:read")

        self.reportes = Modulo.objects.create(
            clave="administracion.panel.reportes",
            titulo="Reportes",
            id_parent=self.panel,
            url="/admin/reportes",
            orden=2,
        )
        self._link_permission(self.reportes, "admin:gestion:reportes:read")

        # Item raiz secundario sin permisos declarados (ej. "Soporte") --
        # segun diseno, siempre visible.
        self.soporte = Modulo.objects.create(
            clave="soporte",
            titulo="Soporte",
            grupo=Modulo.Grupo.SECONDARY,
            url="/soporte",
            orden=1,
        )

    @staticmethod
    def _link_permission(modulo, code):
        permiso, _ = Permisos.objects.get_or_create(
            codigo=code, defaults={"descripcion": code, "is_active": True}
        )
        ModuloPermiso.objects.create(id_modulo=modulo, id_permiso=permiso)

    @staticmethod
    def _create_user(username, *, is_admin=False, permission_codes=None):
        user = SyUsuario.objects.create(
            usuario=username,
            correo=f"{username}@example.com",
            clave_hash="hash",
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=user, nombre="Test", paterno="Nav", materno=""
        )
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


class GetNavigationMenuUseCaseTests(_NavigationTreeFixtureMixin, TestCase):
    """
    Unit tests de la poda del arbol de navegacion. Replica exactamente la
    semantica de `filterNavigation.ts`: un modulo SIN permisos declarados
    pasa siempre la puerta de permiso (es "publico"); un modulo CON
    permisos declarados requiere >=1 match (OR) salvo wildcard `*`.
    Contenedores (con hijos en BD) se ocultan si quedan sin hijos visibles
    y no tienen url propia -- eso es la "visibilidad heredada del padre".
    """

    def test_wildcard_admin_returns_full_tree(self):
        admin = self._create_user("admin_nav", is_admin=True)

        tree = GetNavigationMenuUseCase(self.repository).execute(usuario=admin)

        self.assertEqual(
            _flatten_claves(tree),
            {
                "administracion",
                "administracion.panel",
                "administracion.panel.usuarios",
                "administracion.panel.reportes",
                "soporte",
            },
        )

    def test_partial_permission_returns_only_matching_subset(self):
        user = self._create_user(
            "partial_nav", permission_codes=["admin:gestion:reportes:read"]
        )

        tree = GetNavigationMenuUseCase(self.repository).execute(usuario=user)
        claves = _flatten_claves(tree)

        self.assertIn("administracion.panel.reportes", claves)
        self.assertNotIn("administracion.panel.usuarios", claves)
        self.assertIn("soporte", claves)

    def test_parent_without_own_permission_visible_if_child_visible(self):
        user = self._create_user(
            "panel_child_nav", permission_codes=["admin:gestion:usuarios:read"]
        )

        tree = GetNavigationMenuUseCase(self.repository).execute(usuario=user)

        panel_node = _find_node(tree, "administracion.panel")
        self.assertIsNotNone(panel_node)
        self.assertEqual(
            {child["modulo"].clave for child in panel_node["items"]},
            {"administracion.panel.usuarios"},
        )
        section_node = _find_node(tree, "administracion")
        self.assertIsNotNone(section_node)

    def test_parent_hidden_when_no_child_visible(self):
        user = self._create_user("no_access_nav", permission_codes=[])

        tree = GetNavigationMenuUseCase(self.repository).execute(usuario=user)
        claves = _flatten_claves(tree)

        self.assertNotIn("administracion", claves)
        self.assertNotIn("administracion.panel", claves)
        # "Soporte" no declara permisos -> siempre visible, incluso sin
        # ningun permiso efectivo.
        self.assertIn("soporte", claves)


class ListModuleCatalogUseCaseTests(_NavigationTreeFixtureMixin, TestCase):
    """
    A diferencia de `GetNavigationMenuUseCase`, `ListModuleCatalogUseCase`
    NO recibe `usuario` y NO aplica puerta de permiso ni poda de
    contenedores vacios: el admin del catalogo de permisos por rol necesita
    ver TODO el arbol, incluidos los nodos que su propio rol no puede
    navegar.
    """

    def test_returns_full_tree_without_any_actor_context(self):
        tree = ListModuleCatalogUseCase(self.repository).execute()

        self.assertEqual(
            _flatten_claves(tree),
            {
                "administracion",
                "administracion.panel",
                "administracion.panel.usuarios",
                "administracion.panel.reportes",
                "soporte",
            },
        )

    def test_each_node_carries_its_own_permission_codes(self):
        tree = ListModuleCatalogUseCase(self.repository).execute()

        usuarios_node = _find_node(tree, "administracion.panel.usuarios")
        self.assertEqual(usuarios_node["permissions"], ["admin:gestion:usuarios:read"])

        panel_node = _find_node(tree, "administracion.panel")
        self.assertEqual(panel_node["permissions"], [])

    def test_containers_survive_even_where_permission_filter_would_prune_them(self):
        # Mismo fixture, mismo repositorio: para un usuario sin ningun
        # permiso efectivo, GetNavigationMenuUseCase poda "administracion"
        # y "administracion.panel" completos (contenedores que se quedan
        # sin hijos visibles). ListModuleCatalogUseCase no filtra por
        # actor, asi que ambos sobreviven intactos.
        restricted_user = self._create_user("no_access_catalog", permission_codes=[])
        restricted_tree = GetNavigationMenuUseCase(self.repository).execute(
            usuario=restricted_user
        )
        catalog_tree = ListModuleCatalogUseCase(self.repository).execute()

        self.assertNotIn("administracion", _flatten_claves(restricted_tree))
        self.assertIn("administracion", _flatten_claves(catalog_tree))
        self.assertIn("administracion.panel", _flatten_claves(catalog_tree))


class ListModuleCatalogUseCaseNavSeedTests(TestCase):
    """
    Prueba de integracion contra el seed REAL (`navigation_seed.NAV_SEED`),
    tal como lo pide la estrategia de testing del design: el catalogo debe
    exponer TODOS los modulos del seed completos, sin podar, sin importar
    el actor.

    El tamano del seed se deriva de `len(NAV_SEED)` -- NUNCA se hardcodea un
    numero literal aca. `NAV_SEED` es un catalogo vivo (crece o se poda a
    medida que se dan de alta/baja modulos reales); un numero fijo rompe
    este test cada vez que el catalogo cambia sin motivo real relacionado
    al comportamiento bajo prueba.
    """

    def _create_all_seed_permissions(self):
        codigos = set()
        for entry in NAV_SEED:
            codigos.update(entry["permisos"])
        for codigo in codigos:
            Permisos.objects.get_or_create(
                codigo=codigo, defaults={"descripcion": codigo, "is_active": True}
            )

    def test_returns_all_seeded_modules(self):
        self._create_all_seed_permissions()
        call_command("seed_navigation_menu")

        tree = ListModuleCatalogUseCase(NavigationMenuRepository()).execute()
        claves = _flatten_claves(tree)

        self.assertEqual(len(claves), len(NAV_SEED))
        self.assertEqual(claves, {entry["clave"] for entry in NAV_SEED})


class ModuleCatalogSerializerTests(_NavigationTreeFixtureMixin, TestCase):
    def test_serialize_module_catalog_emits_key_and_permissions_per_level(self):
        tree = ListModuleCatalogUseCase(self.repository).execute()

        payload = serialize_module_catalog(tree)

        self.assertEqual(
            {node["key"] for node in payload["modules"]},
            {"administracion", "soporte"},
        )

        admin_node = next(
            node for node in payload["modules"] if node["key"] == "administracion"
        )
        self.assertEqual(admin_node["title"], "Administracion")
        self.assertEqual(admin_node["group"], Modulo.Grupo.PRIMARY)
        self.assertTrue(admin_node["isSection"])
        self.assertEqual(admin_node["permissions"], [])
        self.assertEqual(len(admin_node["items"]), 1)

        panel_node = admin_node["items"][0]
        self.assertEqual(panel_node["key"], "administracion.panel")
        usuarios_node = next(
            node
            for node in panel_node["items"]
            if node["key"] == "administracion.panel.usuarios"
        )
        self.assertEqual(
            usuarios_node["permissions"], ["admin:gestion:usuarios:read"]
        )
        self.assertEqual(usuarios_node["url"], "/admin/usuarios")
        self.assertEqual(usuarios_node["items"], [])

        soporte_node = next(
            node for node in payload["modules"] if node["key"] == "soporte"
        )
        self.assertEqual(soporte_node["group"], Modulo.Grupo.SECONDARY)
        self.assertFalse(soporte_node["isSection"])


class NavigationMenuViewTests(APITestCase):
    def setUp(self):
        self.user = SyUsuario.objects.create(
            usuario="nav_view_user",
            correo="nav.view@example.com",
            clave_hash=make_password("Nav_123456"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=self.user, nombre="Nav", paterno="View", materno=""
        )
        self.role = Roles.objects.create(
            rol="NAV_VIEW_ROLE",
            desc_rol="Rol de prueba",
            landing_route="/x",
            is_active=True,
        )
        RelUsuarioRol.objects.create(
            id_usuario=self.user, id_rol=self.role, is_primary=True
        )

        Modulo.objects.create(
            clave="administracion",
            titulo="Administracion",
            es_seccion=True,
            grupo=Modulo.Grupo.PRIMARY,
        )
        Modulo.objects.create(
            clave="soporte",
            titulo="Soporte",
            grupo=Modulo.Grupo.SECONDARY,
            url="/soporte",
        )

        PolicyStore().clear_active_session(self.user.id_usuario)
        login_response = self.client.post(
            "/api/v1/auth/login",
            {"username": "nav_view_user", "password": "Nav_123456"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.client.cookies = login_response.cookies
        self.csrf_token = login_response.cookies.get(CSRF_COOKIE).value

    @override_settings(NAVIGATION_MENU_SOURCE="db")
    def test_returns_200_with_filtered_tree_when_authenticated(self):
        response = self.client.get("/api/v1/navigation-menu")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["source"], "db")
        self.assertTrue(
            any(
                section["title"] == "Administracion"
                for section in response.data["sections"]
            )
        )
        self.assertTrue(
            any(item["title"] == "Soporte" for item in response.data["secondaryItems"])
        )

    def test_returns_401_without_authentication(self):
        self.client.cookies.clear()

        response = self.client.get("/api/v1/navigation-menu")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(NAVIGATION_MENU_SOURCE="static")
    def test_returns_static_empty_tree_when_flag_off(self):
        response = self.client.get("/api/v1/navigation-menu")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {"source": "static", "sections": [], "secondaryItems": []},
        )

    @override_settings(NAVIGATION_MENU_SOURCE="db")
    def test_emits_audit_event_on_success(self):
        self.client.get("/api/v1/navigation-menu")

        event = AuditoriaEvento.objects.filter(accion="NAVIGATION_MENU_READ").latest(
            "id_evento"
        )
        self.assertEqual(event.resultado, "SUCCESS")
        self.assertEqual(event.meta.get("source"), "db")

    def test_emits_audit_event_on_auth_failure(self):
        self.client.cookies.clear()

        self.client.get("/api/v1/navigation-menu")

        event = AuditoriaEvento.objects.filter(accion="NAVIGATION_MENU_READ").latest(
            "id_evento"
        )
        self.assertEqual(event.resultado, "FAIL")


class ModuleCatalogViewTests(APITestCase):
    """
    `GET /api/v1/modules`: a diferencia de `/navigation-menu`, exige el
    permiso especifico `admin:gestion:roles:read` (no solo autenticacion),
    NO filtra la respuesta por los permisos efectivos del actor logueado, y
    responde igual sin importar `NAVIGATION_MENU_SOURCE`.
    """

    def setUp(self):
        self.roles_read_perm = Permisos.objects.create(
            codigo="admin:gestion:roles:read",
            descripcion="Leer roles",
            is_active=True,
        )
        self.usuarios_read_perm = Permisos.objects.create(
            codigo="admin:gestion:usuarios:read",
            descripcion="Leer usuarios",
            is_active=True,
        )

        self.section = Modulo.objects.create(
            clave="administracion",
            titulo="Administracion",
            es_seccion=True,
            grupo=Modulo.Grupo.PRIMARY,
        )
        self.item = Modulo.objects.create(
            clave="administracion.panel.usuarios",
            titulo="Usuarios",
            id_parent=self.section,
            url="/admin/usuarios",
        )
        ModuloPermiso.objects.create(
            id_modulo=self.item, id_permiso=self.usuarios_read_perm
        )
        Modulo.objects.create(
            clave="soporte",
            titulo="Soporte",
            grupo=Modulo.Grupo.SECONDARY,
            url="/soporte",
        )

        # Actor A: solo tiene el permiso que exige la vista.
        self.actor_a = self._create_actor(
            "catalog_actor_a",
            "CatalogA_123456",
            permission_codes=["admin:gestion:roles:read"],
        )
        # Actor B: tiene el mismo permiso de acceso a la vista MAS un
        # permiso adicional (admin:gestion:usuarios:read) que el actor A no
        # tiene -- la respuesta debe ser identica para ambos, porque el
        # catalogo no se filtra por permisos efectivos del actor.
        self.actor_b = self._create_actor(
            "catalog_actor_b",
            "CatalogB_123456",
            permission_codes=[
                "admin:gestion:roles:read",
                "admin:gestion:usuarios:read",
            ],
        )
        # Actor sin el permiso que exige la vista.
        self.actor_unauthorized = self._create_actor(
            "catalog_actor_c",
            "CatalogC_123456",
            permission_codes=["admin:gestion:usuarios:read"],
        )

    @staticmethod
    def _create_actor(username, password, *, permission_codes):
        user = SyUsuario.objects.create(
            usuario=username,
            correo=f"{username}@example.com",
            clave_hash=make_password(password),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=user, nombre="Catalog", paterno="Actor", materno=""
        )
        role = Roles.objects.create(
            rol=f"ROLE_{username}",
            desc_rol="Rol de prueba",
            landing_route="/x",
            is_active=True,
        )
        RelUsuarioRol.objects.create(id_usuario=user, id_rol=role, is_primary=True)
        for code in permission_codes:
            permiso = Permisos.objects.get(codigo=code)
            RelRolPermiso.objects.create(id_rol=role, id_permiso=permiso)
        return user

    def _login_as(self, user, password):
        PolicyStore().clear_active_session(user.id_usuario)
        login_response = self.client.post(
            "/api/v1/auth/login",
            {"username": user.usuario, "password": password},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.client.cookies = login_response.cookies

    def test_returns_200_with_full_catalog_when_actor_has_permission(self):
        self._login_as(self.actor_a, "CatalogA_123456")

        response = self.client.get("/api/v1/modules")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        claves = {node["key"] for node in response.data["modules"]}
        self.assertIn("administracion", claves)
        self.assertIn("soporte", claves)

        admin_node = next(
            node for node in response.data["modules"] if node["key"] == "administracion"
        )
        # El actor A NO tiene admin:gestion:usuarios:read, pero el nodo
        # aparece igual: el catalogo no filtra por permisos efectivos del
        # actor (a diferencia de /navigation-menu).
        self.assertEqual(
            {child["key"] for child in admin_node["items"]},
            {"administracion.panel.usuarios"},
        )

    def test_returns_403_without_roles_read_permission(self):
        self._login_as(self.actor_unauthorized, "CatalogC_123456")

        response = self.client.get("/api/v1/modules")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_returns_401_without_authentication(self):
        response = self.client.get("/api/v1/modules")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_response_identical_for_actors_with_different_permissions(self):
        self._login_as(self.actor_a, "CatalogA_123456")
        response_a = self.client.get("/api/v1/modules")

        self.client.cookies.clear()
        self._login_as(self.actor_b, "CatalogB_123456")
        response_b = self.client.get("/api/v1/modules")

        self.assertEqual(response_a.status_code, status.HTTP_200_OK)
        self.assertEqual(response_b.status_code, status.HTTP_200_OK)
        self.assertEqual(response_a.data, response_b.data)

    def test_response_identical_regardless_of_navigation_menu_source_value(self):
        self._login_as(self.actor_a, "CatalogA_123456")

        with override_settings(NAVIGATION_MENU_SOURCE="db"):
            response_db = self.client.get("/api/v1/modules")
        with override_settings(NAVIGATION_MENU_SOURCE="static"):
            response_static = self.client.get("/api/v1/modules")

        self.assertEqual(response_db.status_code, status.HTTP_200_OK)
        self.assertEqual(response_static.status_code, status.HTTP_200_OK)
        self.assertEqual(response_db.data, response_static.data)

    @override_settings(NAVIGATION_MENU_SOURCE="db")
    def test_emits_module_catalog_read_audit_event(self):
        self._login_as(self.actor_a, "CatalogA_123456")

        self.client.get("/api/v1/modules")

        event = AuditoriaEvento.objects.filter(accion="MODULE_CATALOG_READ").latest(
            "id_evento"
        )
        self.assertEqual(event.resultado, "SUCCESS")
