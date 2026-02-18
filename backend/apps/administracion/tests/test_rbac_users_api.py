from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.administracion.models import RelUsuarioOverride, RelUsuarioRol
from apps.authentication.models import DetUsuario, SyUsuario
from apps.authentication.services.token_service import CSRF_COOKIE
from apps.catalogos.models import CatCentroAtencion, CatPermiso, CatRol


class RbacUsersApiTests(APITestCase):
    def setUp(self):
        self.admin = SyUsuario.objects.create(
            usuario="admin_users",
            correo="admin.users@example.com",
            clave_hash=make_password("Admin_123456"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=self.admin,
            nombre="Admin",
            paterno="Users",
            materno="",
            nombre_completo="Admin Users",
        )

        self.admin_role = CatRol.objects.create(
            rol="ADMIN_TEST_USERS",
            desc_rol="Administrador de usuarios",
            landing_route="/admin/users",
            is_admin=True,
            is_active=True,
        )
        RelUsuarioRol.objects.create(
            id_usuario=self.admin,
            id_rol=self.admin_role,
            is_primary=True,
        )

        self.role_medico = CatRol.objects.create(
            rol="MEDICO_USERS",
            desc_rol="Rol medico",
            landing_route="/medico",
            is_active=True,
        )
        self.role_recepcion = CatRol.objects.create(
            rol="RECEPCION_USERS",
            desc_rol="Rol recepcion",
            landing_route="/recepcion",
            is_active=True,
        )

        self.clinic = CatCentroAtencion.objects.create(
            name="Centro Usuarios",
            code="CU-001",
            is_external=False,
            address="Calle Uno 1",
            schedule={"mon": "08:00-16:00"},
            is_active=True,
            created_by_id=self.admin.id_usuario,
        )

        self.override_permission = CatPermiso.objects.create(
            codigo="farmacia:read",
            descripcion="Leer farmacia",
            is_active=True,
        )

        self.target_user = SyUsuario.objects.create(
            usuario="target_user",
            correo="target.user@example.com",
            clave_hash=make_password("Target_123456"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=self.target_user,
            nombre="Target",
            paterno="User",
            materno="",
            nombre_completo="Target User",
            id_centro_atencion=self.clinic,
        )
        RelUsuarioRol.objects.create(
            id_usuario=self.target_user,
            id_rol=self.role_medico,
            is_primary=True,
            usr_asignacion=self.admin,
        )

        login_response = self.client.post(
            "/api/v1/auth/login",
            {"username": "admin_users", "password": "Admin_123456"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.client.cookies = login_response.cookies
        self.csrf_token = login_response.cookies.get(CSRF_COOKIE).value

    def test_users_list_pending_filter(self):
        pending_user = SyUsuario.objects.create(
            usuario="pending_user",
            correo="pending.user@example.com",
            clave_hash=make_password("Pending_123456"),
            est_activo=True,
            cambiar_clave=True,
            terminos_acept=False,
        )
        DetUsuario.objects.create(
            id_usuario=pending_user,
            nombre="Pending",
            paterno="User",
            materno="",
            nombre_completo="Pending User",
        )
        RelUsuarioRol.objects.create(
            id_usuario=pending_user,
            id_rol=self.role_recepcion,
            is_primary=True,
            usr_asignacion=self.admin,
        )

        response = self.client.get("/api/v1/users?status=pending")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = {item["username"] for item in response.data["items"]}
        self.assertIn("pending_user", usernames)
        self.assertNotIn("target_user", usernames)

    def test_users_list_filters_search_role_clinic_and_status(self):
        response_search = self.client.get("/api/v1/users?search=target")
        self.assertEqual(response_search.status_code, status.HTTP_200_OK)
        usernames_search = {item["username"] for item in response_search.data["items"]}
        self.assertIn("target_user", usernames_search)

        response_is_active = self.client.get("/api/v1/users?isActive=true")
        self.assertEqual(response_is_active.status_code, status.HTTP_200_OK)

        response_role = self.client.get(f"/api/v1/users?roleId={self.role_medico.id_rol}")
        self.assertEqual(response_role.status_code, status.HTTP_200_OK)

        response_clinic = self.client.get(f"/api/v1/users?clinicId={self.clinic.id}")
        self.assertEqual(response_clinic.status_code, status.HTTP_200_OK)

        response_active = self.client.get("/api/v1/users?status=active")
        self.assertEqual(response_active.status_code, status.HTTP_200_OK)
        response_inactive = self.client.get("/api/v1/users?status=inactive")
        self.assertEqual(response_inactive.status_code, status.HTTP_200_OK)

    def test_users_list_invalid_is_active_returns_validation_error(self):
        response = self.client.get("/api/v1/users?isActive=quizas")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "VALIDATION_ERROR")

    def test_users_list_invalid_pagination_format_returns_invalid_format(self):
        response = self.client.get("/api/v1/users?page=uno&pageSize=veinte")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "INVALID_FORMAT")

    @patch("apps.administracion.views.rbac_views.send_user_credentials_email")
    def test_create_user_success_contract(self, send_email_mock):
        send_email_mock.return_value = True

        response = self.client.post(
            "/api/v1/users",
            {
                "username": "new_user",
                "firstName": "Nuevo",
                "paternalName": "Usuario",
                "maternalName": "Demo",
                "email": "new.user@example.com",
                "clinicId": self.clinic.id,
                "primaryRoleId": self.role_recepcion.id_rol,
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data)
        self.assertEqual(response.data["username"], "new_user")
        self.assertNotIn("temporaryPassword", response.data)
        send_email_mock.assert_called_once()
        credentials_password = send_email_mock.call_args.kwargs["temporary_password"]
        self.assertEqual(len(credentials_password), 12)
        self.assertRegex(credentials_password, r"[a-z]")
        self.assertRegex(credentials_password, r"[A-Z]")
        self.assertRegex(credentials_password, r"[0-9]")
        self.assertRegex(credentials_password, r"[!@#$%^&*()\-_=+\[\]{}]")

        created_user = SyUsuario.objects.get(id_usuario=response.data["id"])
        self.assertTrue(created_user.cambiar_clave)
        self.assertFalse(created_user.terminos_acept)

    @patch("apps.administracion.views.rbac_views.send_user_credentials_email")
    def test_create_user_email_failure_rolls_back_creation(self, send_email_mock):
        send_email_mock.return_value = False

        response = self.client.post(
            "/api/v1/users",
            {
                "username": "new_user_email_fail",
                "firstName": "Nuevo",
                "paternalName": "Error",
                "maternalName": "Correo",
                "email": "new.user.email.fail@example.com",
                "clinicId": self.clinic.id,
                "primaryRoleId": self.role_recepcion.id_rol,
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data["code"], "EMAIL_DELIVERY_FAILED")
        self.assertFalse(SyUsuario.objects.filter(usuario="new_user_email_fail").exists())

    def test_create_user_duplicate_returns_conflict(self):
        response = self.client.post(
            "/api/v1/users",
            {
                "username": "target_user",
                "firstName": "Duplicado",
                "paternalName": "Usuario",
                "email": "target.user@example.com",
                "primaryRoleId": self.role_medico.id_rol,
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["code"], "USER_EXISTS")

    def test_create_user_missing_required_fields_returns_validation_error(self):
        response = self.client.post(
            "/api/v1/users",
            {"username": "incompleto"},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "VALIDATION_ERROR")

    def test_create_user_role_not_found(self):
        response = self.client.post(
            "/api/v1/users",
            {
                "username": "without_role",
                "firstName": "Sin",
                "paternalName": "Rol",
                "email": "without.role@example.com",
                "primaryRoleId": 999999,
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "ROLE_NOT_FOUND")

    def test_create_user_clinic_not_found(self):
        response = self.client.post(
            "/api/v1/users",
            {
                "username": "without_clinic",
                "firstName": "Sin",
                "paternalName": "Clinica",
                "email": "without.clinic@example.com",
                "clinicId": 999999,
                "primaryRoleId": self.role_medico.id_rol,
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "CLINIC_NOT_FOUND")

    def test_user_detail_contract(self):
        response = self.client.get(f"/api/v1/users/{self.target_user.id_usuario}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("user", response.data)
        self.assertIn("roles", response.data)
        self.assertIn("overrides", response.data)
        self.assertEqual(response.data["user"]["username"], "target_user")
        self.assertIn("fullname", response.data["user"])
        self.assertIn("fullName", response.data["user"])

    def test_user_detail_not_found(self):
        response = self.client.get("/api/v1/users/999999")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "USER_NOT_FOUND")

    def test_patch_user_success(self):
        response = self.client.patch(
            f"/api/v1/users/{self.target_user.id_usuario}",
            {
                "email": "target.updated@example.com",
                "firstName": "TargetEdit",
                "paternalName": "UserEdit",
                "maternalName": "Final",
                "clinicId": None,
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["email"], "target.updated@example.com")
        self.assertEqual(response.data["user"]["firstName"], "TargetEdit")
        self.assertIsNone(response.data["user"]["clinic"])

    def test_patch_user_sets_valid_clinic(self):
        response = self.client.patch(
            f"/api/v1/users/{self.target_user.id_usuario}",
            {"clinicId": self.clinic.id},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["clinic"]["id"], self.clinic.id)

    def test_patch_user_not_found(self):
        response = self.client.patch(
            "/api/v1/users/999999",
            {"firstName": "Nope"},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "USER_NOT_FOUND")

    def test_patch_user_duplicate_email_returns_conflict(self):
        another_user = SyUsuario.objects.create(
            usuario="another_user",
            correo="another.user@example.com",
            clave_hash=make_password("Another_123456"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=another_user,
            nombre="Another",
            paterno="User",
            materno="",
            nombre_completo="Another User",
        )

        response = self.client.patch(
            f"/api/v1/users/{self.target_user.id_usuario}",
            {"email": "another.user@example.com"},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["code"], "USER_EXISTS")

    def test_patch_user_invalid_clinic_returns_not_found(self):
        response = self.client.patch(
            f"/api/v1/users/{self.target_user.id_usuario}",
            {"clinicId": 999999},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "CLINIC_NOT_FOUND")

    def test_patch_user_creates_missing_detail_record(self):
        DetUsuario.objects.filter(id_usuario=self.target_user).delete()

        response = self.client.patch(
            f"/api/v1/users/{self.target_user.id_usuario}",
            {
                "firstName": "Sin",
                "paternalName": "Detalle",
                "maternalName": "Previo",
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["firstName"], "Sin")
        self.assertTrue(
            DetUsuario.objects.filter(id_usuario=self.target_user, nombre="Sin").exists()
        )

    def test_activate_and_deactivate_user(self):
        deactivate_response = self.client.patch(
            f"/api/v1/users/{self.target_user.id_usuario}/deactivate",
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )
        self.assertEqual(deactivate_response.status_code, status.HTTP_200_OK)
        self.assertFalse(deactivate_response.data["isActive"])

        activate_response = self.client.patch(
            f"/api/v1/users/{self.target_user.id_usuario}/activate",
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )
        self.assertEqual(activate_response.status_code, status.HTTP_200_OK)
        self.assertTrue(activate_response.data["isActive"])

    def test_deactivate_own_user_returns_conflict(self):
        response = self.client.patch(
            f"/api/v1/users/{self.admin.id_usuario}/deactivate",
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["code"], "SELF_DEACTIVATION_NOT_ALLOWED")
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.est_activo)

    def test_activate_user_not_found(self):
        response = self.client.patch(
            "/api/v1/users/999999/activate",
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "USER_NOT_FOUND")

    def test_assign_roles_and_set_primary(self):
        assign_response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/roles",
            {"roleIds": [self.role_recepcion.id_rol]},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )
        self.assertEqual(assign_response.status_code, status.HTTP_201_CREATED)
        assigned_role_names = {role["name"] for role in assign_response.data["roles"]}
        self.assertIn("RECEPCION_USERS", assigned_role_names)

        primary_response = self.client.put(
            f"/api/v1/users/{self.target_user.id_usuario}/roles/primary",
            {"roleId": self.role_recepcion.id_rol},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )
        self.assertEqual(primary_response.status_code, status.HTTP_200_OK)
        primary_roles = [role for role in primary_response.data["roles"] if role["isPrimary"]]
        self.assertEqual(len(primary_roles), 1)
        self.assertEqual(primary_roles[0]["name"], "RECEPCION_USERS")

    def test_assign_roles_with_invalid_payload(self):
        response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/roles",
            {"roleIds": []},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "VALIDATION_ERROR")

    def test_assign_roles_user_not_found(self):
        response = self.client.post(
            "/api/v1/users/999999/roles",
            {"roleIds": [self.role_recepcion.id_rol]},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "USER_NOT_FOUND")

    def test_assign_roles_with_missing_role_ids_returns_not_found(self):
        response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/roles",
            {"roleIds": [999999]},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "ROLE_NOT_FOUND")

    def test_assign_roles_reactivates_soft_deleted_relation(self):
        relation = RelUsuarioRol.objects.create(
            id_usuario=self.target_user,
            id_rol=self.role_recepcion,
            is_primary=False,
            usr_asignacion=self.admin,
        )
        relation.fch_baja = timezone.now()
        relation.usr_baja = self.admin
        relation.save(update_fields=["fch_baja", "usr_baja"])

        response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/roles",
            {"roleIds": [self.role_recepcion.id_rol]},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        relation.refresh_from_db()
        self.assertIsNone(relation.fch_baja)

    def test_assign_roles_ensures_primary_exists(self):
        RelUsuarioRol.objects.filter(id_usuario=self.target_user).update(is_primary=False)

        response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/roles",
            {"roleIds": [self.role_recepcion.id_rol]},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        primary_roles = [role for role in response.data["roles"] if role["isPrimary"]]
        self.assertEqual(len(primary_roles), 1)

    def test_revoke_last_role_returns_error(self):
        response = self.client.delete(
            f"/api/v1/users/{self.target_user.id_usuario}/roles/{self.role_medico.id_rol}",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "CANNOT_REMOVE_LAST_ROLE")

    def test_revoke_primary_role_promotes_another(self):
        RelUsuarioRol.objects.create(
            id_usuario=self.target_user,
            id_rol=self.role_recepcion,
            is_primary=False,
            usr_asignacion=self.admin,
        )

        response = self.client.delete(
            f"/api/v1/users/{self.target_user.id_usuario}/roles/{self.role_medico.id_rol}",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["roles"]), 1)
        self.assertEqual(response.data["roles"][0]["name"], "RECEPCION_USERS")
        self.assertTrue(response.data["roles"][0]["isPrimary"])

    def test_set_primary_role_requires_role_id(self):
        response = self.client.put(
            f"/api/v1/users/{self.target_user.id_usuario}/roles/primary",
            {},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "VALIDATION_ERROR")

    def test_set_primary_role_not_found(self):
        response = self.client.put(
            f"/api/v1/users/{self.target_user.id_usuario}/roles/primary",
            {"roleId": 999999},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "ROLE_NOT_FOUND")

    def test_set_primary_role_user_not_found(self):
        response = self.client.put(
            "/api/v1/users/999999/roles/primary",
            {"roleId": self.role_recepcion.id_rol},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "USER_NOT_FOUND")

    def test_revoke_role_not_found(self):
        response = self.client.delete(
            f"/api/v1/users/{self.target_user.id_usuario}/roles/999999",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "ROLE_NOT_FOUND")

    def test_revoke_role_user_not_found(self):
        response = self.client.delete(
            f"/api/v1/users/999999/roles/{self.role_medico.id_rol}",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "USER_NOT_FOUND")

    def test_override_upsert_and_remove(self):
        expires_at = (timezone.now() + timedelta(days=2)).isoformat()
        upsert_response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides",
            {
                "permissionCode": self.override_permission.codigo,
                "effect": "ALLOW",
                "expiresAt": expires_at,
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(upsert_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(upsert_response.data["overrides"]), 1)
        self.assertEqual(upsert_response.data["overrides"][0]["effect"], "ALLOW")

        remove_response = self.client.delete(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides/{self.override_permission.codigo}",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )
        self.assertEqual(remove_response.status_code, status.HTTP_200_OK)
        self.assertEqual(remove_response.data["overrides"], [])

    def test_override_upsert_date_only_expires_at_is_end_of_day(self):
        response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides",
            {
                "permissionCode": self.override_permission.codigo,
                "effect": "ALLOW",
                "expiresAt": "2030-01-03",
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        override = RelUsuarioOverride.objects.get(
            id_usuario=self.target_user,
            id_permiso=self.override_permission,
            fch_baja__isnull=True,
        )
        expires_local = timezone.localtime(override.fch_expira)
        self.assertEqual(expires_local.hour, 23)
        self.assertEqual(expires_local.minute, 59)
        self.assertEqual(expires_local.second, 59)

    def test_override_upsert_updates_existing_override(self):
        RelUsuarioOverride.objects.create(
            id_usuario=self.target_user,
            id_permiso=self.override_permission,
            efecto="ALLOW",
            usr_asignacion=self.admin,
        )

        response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides",
            {
                "permissionCode": self.override_permission.codigo,
                "effect": "DENY",
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["overrides"]), 1)
        self.assertEqual(response.data["overrides"][0]["effect"], "DENY")

    def test_override_upsert_sets_assigned_by_when_missing(self):
        override = RelUsuarioOverride.objects.create(
            id_usuario=self.target_user,
            id_permiso=self.override_permission,
            efecto="ALLOW",
            usr_asignacion=None,
        )

        response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides",
            {
                "permissionCode": self.override_permission.codigo,
                "effect": "ALLOW",
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        override.refresh_from_db()
        self.assertIsNotNone(override.usr_asignacion_id)

    def test_override_validation_errors(self):
        invalid_effect_response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides",
            {
                "permissionCode": self.override_permission.codigo,
                "effect": "MAYBE",
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )
        self.assertEqual(invalid_effect_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(invalid_effect_response.data["code"], "VALIDATION_ERROR")

        invalid_date_response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides",
            {
                "permissionCode": self.override_permission.codigo,
                "effect": "ALLOW",
                "expiresAt": "no-es-fecha",
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )
        self.assertEqual(invalid_date_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(invalid_date_response.data["code"], "INVALID_FORMAT")

    def test_override_permission_not_found(self):
        response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides",
            {
                "permissionCode": "inexistente:read",
                "effect": "ALLOW",
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "PERMISSION_NOT_FOUND")

    def test_override_user_not_found(self):
        response = self.client.post(
            "/api/v1/users/999999/overrides",
            {
                "permissionCode": self.override_permission.codigo,
                "effect": "ALLOW",
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "USER_NOT_FOUND")

    def test_remove_override_user_not_found(self):
        response = self.client.delete(
            f"/api/v1/users/999999/overrides/{self.override_permission.codigo}",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "USER_NOT_FOUND")

    def test_remove_override_is_idempotent(self):
        response = self.client.delete(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides/{self.override_permission.codigo}",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["overrides"], [])
        self.assertEqual(
            RelUsuarioOverride.objects.filter(id_usuario=self.target_user, fch_baja__isnull=True).count(),
            0,
        )
