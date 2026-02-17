from datetime import timedelta
from unittest.mock import patch

from django.http import HttpResponse
from django.test import RequestFactory, SimpleTestCase, TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.administracion.constants.rbac_actions import RBACActions
from apps.administracion.exceptions import custom_exception_handler
from apps.administracion.middleware.request_id import RequestIDMiddleware
from apps.administracion.models import (AuditoriaEvento, RelRolPermiso,
                                        RelUsuarioOverride, RelUsuarioRol)
from apps.administracion.serializers.role_serializers import RoleDetailSerializer
from apps.administracion.services.audit_service import AuditService
from apps.administracion.services.rbac_resolver import RBACResolver
from apps.administracion.use_cases.roles.create_role import CreateRoleUseCase
from apps.administracion.use_cases.users.assign_roles import AssignRolesUseCase
from apps.administracion.views.role_views import RoleCreateView
from apps.authentication.models import DetUsuario, SyUsuario
from apps.catalogos.models import CatPermiso, CatRol


class RequestIDMiddlewareTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_preserves_existing_request_id(self):
        def get_response(_request):
            return HttpResponse("ok")

        middleware = RequestIDMiddleware(get_response)
        request = self.factory.get("/api/test", HTTP_X_REQUEST_ID="req-existente")

        response = middleware(request)

        self.assertEqual(request.request_id, "req-existente")
        self.assertEqual(response["X-Request-ID"], "req-existente")

    def test_generates_request_id_when_missing(self):
        def get_response(_request):
            return HttpResponse("ok")

        middleware = RequestIDMiddleware(get_response)
        request = self.factory.get("/api/test")

        response = middleware(request)

        self.assertTrue(hasattr(request, "request_id"))
        self.assertTrue(request.request_id)
        self.assertEqual(response["X-Request-ID"], request.request_id)


class CustomExceptionHandlerTests(SimpleTestCase):
    def test_returns_api_error_for_drf_exception(self):
        response = custom_exception_handler(ValidationError("dato invalido"), {"view": None})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "API_ERROR")
        self.assertEqual(response.data["status"], 400)

    def test_returns_internal_error_for_unhandled_exception(self):
        response = custom_exception_handler(Exception("boom"), {"view": None})

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data["code"], "INTERNAL_SERVER_ERROR")
        self.assertEqual(response.data["status"], 500)

    @patch("apps.administracion.exceptions.exception_handler")
    def test_preserves_nested_detail_payload_with_details_and_request_id(self, handler_mock):
        handler_mock.return_value = Response(
            {
                "detail": {
                    "code": "PERMISSION_DENIED",
                    "message": "No tienes permiso",
                    "details": {"field": ["error"]},
                    "requestId": "req-xyz",
                }
            },
            status=403,
        )

        response = custom_exception_handler(Exception("x"), {"view": None})

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["code"], "PERMISSION_DENIED")
        self.assertEqual(response.data["requestId"], "req-xyz")
        self.assertIn("details", response.data)


class RbacResolverTests(TestCase):
    def setUp(self):
        self.user = SyUsuario.objects.create(
            usuario="resolver_user",
            correo="resolver.user@example.com",
            clave_hash="hash",
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=self.user,
            nombre="Resolver",
            paterno="User",
            materno="",
            nombre_completo="Resolver User",
        )

        self.role = CatRol.objects.create(
            rol="RESOLVER_ROLE",
            desc_rol="Role resolver",
            landing_route="/resolver",
            is_active=True,
        )
        RelUsuarioRol.objects.create(id_usuario=self.user, id_rol=self.role, is_primary=True)

        self.perm_read = CatPermiso.objects.create(
            codigo="expedientes:read",
            descripcion="Leer expedientes",
            is_active=True,
        )
        self.perm_write = CatPermiso.objects.create(
            codigo="expedientes:update",
            descripcion="Actualizar expedientes",
            is_active=True,
        )
        RelRolPermiso.objects.create(id_rol=self.role, id_permiso=self.perm_read)
        RelRolPermiso.objects.create(id_rol=self.role, id_permiso=self.perm_write)

    def test_returns_wildcard_for_admin_role(self):
        self.role.is_admin = True
        self.role.save(update_fields=["is_admin"])

        permissions = RBACResolver.get_effective_permissions(self.user)

        self.assertEqual(permissions, ["*"])

    def test_applies_allow_deny_and_ignores_expired_overrides(self):
        extra_perm = CatPermiso.objects.create(
            codigo="farmacia:read",
            descripcion="Leer farmacia",
            is_active=True,
        )
        RelUsuarioOverride.objects.create(
            id_usuario=self.user,
            id_permiso=self.perm_write,
            efecto="DENY",
        )
        RelUsuarioOverride.objects.create(
            id_usuario=self.user,
            id_permiso=extra_perm,
            efecto="ALLOW",
        )
        RelUsuarioOverride.objects.create(
            id_usuario=self.user,
            id_permiso=self.perm_read,
            efecto="DENY",
            fch_expira=timezone.now() - timedelta(days=1),
        )

        permissions = RBACResolver.get_effective_permissions(self.user)

        self.assertIn("expedientes:read", permissions)
        self.assertNotIn("expedientes:update", permissions)
        self.assertIn("farmacia:read", permissions)


class AssignRolesUseCaseTests(TestCase):
    def setUp(self):
        self.user = SyUsuario.objects.create(
            usuario="assign_user",
            correo="assign.user@example.com",
            clave_hash="hash",
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        self.actor = SyUsuario.objects.create(
            usuario="assign_actor",
            correo="assign.actor@example.com",
            clave_hash="hash",
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        self.role = CatRol.objects.create(
            rol="ASSIGN_ROLE",
            desc_rol="Role assign",
            landing_route="/assign",
            is_active=True,
        )

    def test_creates_and_reactivates_user_role_relation(self):
        AssignRolesUseCase.execute(self.user, [self.role], self.actor)
        relation = RelUsuarioRol.objects.get(id_usuario=self.user, id_rol=self.role)
        self.assertIsNone(relation.fch_baja)

        relation.fch_baja = timezone.now() - timedelta(days=1)
        relation.usr_baja = self.actor
        relation.save(update_fields=["fch_baja", "usr_baja"])

        AssignRolesUseCase.execute(self.user, [self.role], self.actor)
        relation.refresh_from_db()
        self.assertIsNone(relation.fch_baja)
        self.assertIsNone(relation.usr_baja)


class CreateRoleUseCaseAndSerializerTests(TestCase):
    def setUp(self):
        self.actor = SyUsuario.objects.create(
            usuario="create_role_actor",
            correo="create.role.actor@example.com",
            clave_hash="hash",
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        self.factory = APIRequestFactory()

    def test_create_role_use_case_creates_role_and_audit(self):
        request = self.factory.post("/api/v1/roles")
        request.user = self.actor
        request.request_id = "req-create-role"
        request.META["REMOTE_ADDR"] = "127.0.0.1"
        request.META["HTTP_USER_AGENT"] = "test-agent"

        role = CreateRoleUseCase.execute(
            request,
            {
                "name": "ROLE_FROM_USECASE",
                "description": "Rol desde use case",
                "landingRoute": "/usecase",
            },
        )

        self.assertEqual(role.rol, "ROLE_FROM_USECASE")
        self.assertTrue(
            AuditoriaEvento.objects.filter(
                accion=RBACActions.ROLE_CREATE,
                recurso_id=role.id_rol,
            ).exists()
        )

    def test_role_detail_serializer_shape(self):
        role = CatRol.objects.create(
            rol="SERIALIZER_ROLE",
            desc_rol="Rol serializer",
            landing_route="/serializer",
            is_active=True,
        )

        data = RoleDetailSerializer(role).data

        self.assertEqual(data["id"], role.id_rol)
        self.assertEqual(data["name"], "SERIALIZER_ROLE")
        self.assertEqual(data["description"], "Rol serializer")
        self.assertEqual(data["landingRoute"], "/serializer")

    def test_role_create_view_uses_use_case_and_returns_response(self):
        request = self.factory.post(
            "/api/v1/roles",
            {
                "name": "ROLE_FROM_VIEW",
                "description": "Rol desde view",
                "landingRoute": "/view",
            },
            format="json",
        )
        force_authenticate(request, user=self.actor)
        request.request_id = "req-create-role-view"
        request.META["REMOTE_ADDR"] = "127.0.0.1"
        request.META["HTTP_USER_AGENT"] = "test-agent"

        response = RoleCreateView.as_view()(request)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["name"], "ROLE_FROM_VIEW")


class AuditServiceTests(TestCase):
    def test_log_event_persists_audit_row(self):
        user = SyUsuario.objects.create(
            usuario="audit_service_user",
            correo="audit.service.user@example.com",
            clave_hash="hash",
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        request = APIRequestFactory().get("/api/v1/roles")
        request.user = user
        request.request_id = "req-audit-service"
        request.META["REMOTE_ADDR"] = "10.0.0.5"
        request.META["HTTP_USER_AGENT"] = "audit-test"

        AuditService.log_event(
            request=request,
            accion="RBAC_ROLE_LIST",
            recurso_tipo="role",
            recurso_id=1,
            resultado="SUCCESS",
        )

        event = AuditoriaEvento.objects.get(request_id="req-audit-service")
        self.assertEqual(event.accion, "RBAC_ROLE_LIST")
        self.assertEqual(event.recurso_tipo, "role")
        self.assertEqual(event.recurso_id, 1)
        self.assertEqual(event.ip_origen, "10.0.0.5")
