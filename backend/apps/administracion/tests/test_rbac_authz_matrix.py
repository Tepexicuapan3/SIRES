from django.contrib.auth.hashers import make_password
from rest_framework import status
from rest_framework.test import APITestCase

from apps.administracion.models import RelUsuarioRol
from apps.authentication.models import DetUsuario, SyUsuario
from apps.authentication.services.token_service import CSRF_COOKIE
from apps.catalogos.models import Permisos, Roles


class RbacAuthzMatrixTests(APITestCase):
    def setUp(self):
        self.user = SyUsuario.objects.create(
            usuario="no_priv_user",
            correo="no.priv.user@example.com",
            clave_hash=make_password("NoPriv_123456"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=self.user,
            nombre="NoPriv",
            paterno="User",
            materno="",
            nombre_completo="NoPriv User",
        )

        role = Roles.objects.create(
            rol="BASIC_NO_PRIV",
            desc_rol="Rol sin permisos",
            landing_route="/home",
            is_active=True,
        )
        RelUsuarioRol.objects.create(id_usuario=self.user, id_rol=role, is_primary=True)

        self.target_role = Roles.objects.create(
            rol="TARGET_ROLE_NO_PRIV",
            desc_rol="Target role",
            landing_route="/target",
            is_active=True,
        )
        self.target_permission = Permisos.objects.create(
            codigo="target:read",
            descripcion="Target read",
            is_active=True,
        )

        self.target_user = SyUsuario.objects.create(
            usuario="target_nopriv",
            correo="target.nopriv@example.com",
            clave_hash=make_password("Target_123456"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=self.target_user,
            nombre="Target",
            paterno="NoPriv",
            materno="",
            nombre_completo="Target NoPriv",
        )
        RelUsuarioRol.objects.create(
            id_usuario=self.target_user,
            id_rol=self.target_role,
            is_primary=True,
        )

        login_response = self.client.post(
            "/api/v1/auth/login",
            {"username": "no_priv_user", "password": "NoPriv_123456"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.client.cookies = login_response.cookies
        self.csrf_token = login_response.cookies.get(CSRF_COOKIE).value

    def _assert_forbidden(self, response):
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "PERMISSION_DENIED")

    def test_roles_endpoints_require_permissions(self):
        self._assert_forbidden(self.client.get("/api/v1/roles"))
        self._assert_forbidden(
            self.client.post(
                "/api/v1/roles",
                {"name": "X", "description": "Y"},
                format="json",
                HTTP_X_CSRF_TOKEN=self.csrf_token,
            )
        )
        self._assert_forbidden(self.client.get(f"/api/v1/roles/{self.target_role.id_rol}"))
        self._assert_forbidden(
            self.client.put(
                f"/api/v1/roles/{self.target_role.id_rol}",
                {"description": "No"},
                format="json",
                HTTP_X_CSRF_TOKEN=self.csrf_token,
            )
        )
        self._assert_forbidden(
            self.client.delete(
                f"/api/v1/roles/{self.target_role.id_rol}",
                HTTP_X_CSRF_TOKEN=self.csrf_token,
            )
        )

    def test_permissions_endpoints_require_permissions(self):
        self._assert_forbidden(self.client.get("/api/v1/permissions"))
        self._assert_forbidden(
            self.client.post(
                "/api/v1/permissions/assign",
                {
                    "roleId": self.target_role.id_rol,
                    "permissionIds": [self.target_permission.id_permiso],
                },
                format="json",
                HTTP_X_CSRF_TOKEN=self.csrf_token,
            )
        )
        self._assert_forbidden(
            self.client.delete(
                f"/api/v1/permissions/roles/{self.target_role.id_rol}/permissions/{self.target_permission.id_permiso}",
                HTTP_X_CSRF_TOKEN=self.csrf_token,
            )
        )

    def test_users_endpoints_require_permissions(self):
        self._assert_forbidden(self.client.get("/api/v1/users"))
        self._assert_forbidden(
            self.client.post(
                "/api/v1/users",
                {
                    "username": "x",
                    "firstName": "X",
                    "paternalName": "Y",
                    "email": "x@y.com",
                    "primaryRoleId": self.target_role.id_rol,
                },
                format="json",
                HTTP_X_CSRF_TOKEN=self.csrf_token,
            )
        )
        self._assert_forbidden(self.client.get(f"/api/v1/users/{self.target_user.id_usuario}"))
        self._assert_forbidden(
            self.client.patch(
                f"/api/v1/users/{self.target_user.id_usuario}",
                {"firstName": "No"},
                format="json",
                HTTP_X_CSRF_TOKEN=self.csrf_token,
            )
        )
        self._assert_forbidden(
            self.client.patch(
                f"/api/v1/users/{self.target_user.id_usuario}/activate",
                format="json",
                HTTP_X_CSRF_TOKEN=self.csrf_token,
            )
        )
        self._assert_forbidden(
            self.client.patch(
                f"/api/v1/users/{self.target_user.id_usuario}/deactivate",
                format="json",
                HTTP_X_CSRF_TOKEN=self.csrf_token,
            )
        )

    def test_user_subresource_endpoints_require_permissions(self):
        self._assert_forbidden(
            self.client.post(
                f"/api/v1/users/{self.target_user.id_usuario}/roles",
                {"roleIds": [self.target_role.id_rol]},
                format="json",
                HTTP_X_CSRF_TOKEN=self.csrf_token,
            )
        )
        self._assert_forbidden(
            self.client.put(
                f"/api/v1/users/{self.target_user.id_usuario}/roles/primary",
                {"roleId": self.target_role.id_rol},
                format="json",
                HTTP_X_CSRF_TOKEN=self.csrf_token,
            )
        )
        self._assert_forbidden(
            self.client.delete(
                f"/api/v1/users/{self.target_user.id_usuario}/roles/{self.target_role.id_rol}",
                HTTP_X_CSRF_TOKEN=self.csrf_token,
            )
        )
        self._assert_forbidden(
            self.client.post(
                f"/api/v1/users/{self.target_user.id_usuario}/overrides",
                {
                    "permissionCode": self.target_permission.codigo,
                    "effect": "ALLOW",
                },
                format="json",
                HTTP_X_CSRF_TOKEN=self.csrf_token,
            )
        )
        self._assert_forbidden(
            self.client.delete(
                f"/api/v1/users/{self.target_user.id_usuario}/overrides/{self.target_permission.codigo}",
                HTTP_X_CSRF_TOKEN=self.csrf_token,
            )
        )
