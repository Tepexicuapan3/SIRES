from datetime import datetime, timedelta, timezone as dt_timezone
from unittest.mock import patch

from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.administracion.models import (
    AuditoriaEvento,
    RelRolPermiso,
    RelUsuarioOverride,
    RelUsuarioRol,
)
from apps.authentication.models import DetUsuario, SyUsuario
from apps.authentication.services.token_service import CSRF_COOKIE
from apps.catalogos.models import CatCentroAtencion, CatPermiso, CatRol, Permisos, Roles


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

        self.admin_role = Roles.objects.create(
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

        self.role_medico = Roles.objects.create(
            rol="MEDICO_USERS",
            desc_rol="Rol medico",
            landing_route="/medico",
            is_active=True,
        )
        self.role_recepcion = Roles.objects.create(
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

        self.override_permission = Permisos.objects.create(
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

    def _login_as(self, username, password):
        self.client.cookies.clear()
        response = self.client.post(
            "/api/v1/auth/login",
            {"username": username, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.cookies = response.cookies
        self.csrf_token = response.cookies.get(CSRF_COOKIE).value

    def _ensure_permission(self, code, description, is_system=False):
        permission, _ = CatPermiso.objects.get_or_create(
            codigo=code,
            defaults={
                "descripcion": description,
                "is_active": True,
                "es_sistema": is_system,
            },
        )
        update_fields = []
        if not permission.is_active:
            permission.is_active = True
            update_fields.append("is_active")
        if permission.descripcion != description:
            permission.descripcion = description
            update_fields.append("descripcion")
        if permission.es_sistema != is_system:
            permission.es_sistema = is_system
            update_fields.append("es_sistema")
        if update_fields:
            permission.save(update_fields=update_fields)
        return permission

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
        before_assign_revision = self.target_user.fch_modf

        assign_response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/roles",
            {"roleIds": [self.role_recepcion.id_rol]},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )
        self.assertEqual(assign_response.status_code, status.HTTP_201_CREATED)
        self.target_user.refresh_from_db()
        self.assertNotEqual(self.target_user.fch_modf, before_assign_revision)
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

    def test_assign_roles_success_records_audit_event(self):
        response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/roles",
            {"roleIds": [self.role_recepcion.id_rol]},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        event = AuditoriaEvento.objects.filter(accion="RBAC_USER_ROLES_ASSIGN").latest(
            "id_evento"
        )
        self.assertEqual(event.resultado, AuditoriaEvento.Resultado.SUCCESS)
        self.assertEqual(event.recurso_id, self.target_user.id_usuario)
        self.assertEqual(event.target_usuario_id, self.target_user.id_usuario)
        self.assertEqual(event.meta.get("source"), "legacy")
        self.assertEqual(event.meta.get("domain"), "auth_access")

    def test_assign_roles_user_not_found_records_failed_audit_event(self):
        response = self.client.post(
            "/api/v1/users/999999/roles",
            {"roleIds": [self.role_recepcion.id_rol]},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "USER_NOT_FOUND")
        event = AuditoriaEvento.objects.filter(accion="RBAC_USER_ROLES_ASSIGN").latest(
            "id_evento"
        )
        self.assertEqual(event.resultado, AuditoriaEvento.Resultado.FAIL)
        self.assertEqual(event.codigo_error, "USER_NOT_FOUND")
        self.assertEqual(event.recurso_id, 999999)

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

    def test_assign_roles_is_idempotent_on_replay(self):
        first_response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/roles",
            {"roleIds": [self.role_recepcion.id_rol]},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )
        second_response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/roles",
            {"roleIds": [self.role_recepcion.id_rol]},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            RelUsuarioRol.objects.filter(
                id_usuario=self.target_user,
                id_rol=self.role_recepcion,
                fch_baja__isnull=True,
            ).count(),
            1,
        )

    def test_assign_roles_deduplicates_role_ids_in_single_request(self):
        response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/roles",
            {"roleIds": [self.role_recepcion.id_rol, self.role_recepcion.id_rol]},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            RelUsuarioRol.objects.filter(
                id_usuario=self.target_user,
                id_rol=self.role_recepcion,
                fch_baja__isnull=True,
            ).count(),
            1,
        )

    def test_set_primary_role_is_idempotent_on_replay(self):
        RelUsuarioRol.objects.create(
            id_usuario=self.target_user,
            id_rol=self.role_recepcion,
            is_primary=False,
            usr_asignacion=self.admin,
        )

        first_response = self.client.put(
            f"/api/v1/users/{self.target_user.id_usuario}/roles/primary",
            {"roleId": self.role_recepcion.id_rol},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )
        second_response = self.client.put(
            f"/api/v1/users/{self.target_user.id_usuario}/roles/primary",
            {"roleId": self.role_recepcion.id_rol},
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        primary_relations = RelUsuarioRol.objects.filter(
            id_usuario=self.target_user,
            fch_baja__isnull=True,
            is_primary=True,
        )
        self.assertEqual(primary_relations.count(), 1)
        self.assertEqual(primary_relations.first().id_rol_id, self.role_recepcion.id_rol)

    def test_override_upsert_is_idempotent_on_replay(self):
        first_response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides",
            {
                "permissionCode": self.override_permission.codigo,
                "effect": "ALLOW",
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )
        second_response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides",
            {
                "permissionCode": self.override_permission.codigo,
                "effect": "ALLOW",
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            RelUsuarioOverride.objects.filter(
                id_usuario=self.target_user,
                id_permiso=self.override_permission,
                fch_baja__isnull=True,
            ).count(),
            1,
        )

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

    def test_revoke_role_success_records_audit_event(self):
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
        event = AuditoriaEvento.objects.filter(accion="RBAC_USER_ROLE_REVOKE").latest(
            "id_evento"
        )
        self.assertEqual(event.resultado, AuditoriaEvento.Resultado.SUCCESS)
        self.assertEqual(event.recurso_id, self.target_user.id_usuario)
        self.assertEqual(event.target_usuario_id, self.target_user.id_usuario)
        self.assertEqual(event.meta.get("source"), "legacy")

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
        initial_revision = self.target_user.fch_modf

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
        self.target_user.refresh_from_db()
        self.assertNotEqual(self.target_user.fch_modf, initial_revision)
        revision_after_upsert = self.target_user.fch_modf

        remove_response = self.client.delete(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides/{self.override_permission.codigo}",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )
        self.assertEqual(remove_response.status_code, status.HTTP_200_OK)
        self.assertEqual(remove_response.data["overrides"], [])
        self.target_user.refresh_from_db()
        self.assertNotEqual(self.target_user.fch_modf, revision_after_upsert)

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

    def test_override_upsert_datetime_with_timezone_normalizes_to_local_day_end(self):
        response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides",
            {
                "permissionCode": self.override_permission.codigo,
                "effect": "ALLOW",
                "expiresAt": "2030-01-03T02:15:00Z",
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
        expected_local_date = timezone.localtime(
            datetime(2030, 1, 3, 2, 15, 0, tzinfo=dt_timezone.utc),
            timezone.get_current_timezone(),
        ).date()
        self.assertEqual(expires_local.date(), expected_local_date)
        self.assertEqual(expires_local.hour, 23)
        self.assertEqual(expires_local.minute, 59)
        self.assertEqual(expires_local.second, 59)
        self.assertEqual(expires_local.microsecond, 999999)

    def test_override_upsert_success_records_audit_event(self):
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
        event = AuditoriaEvento.objects.filter(accion="RBAC_USER_OVERRIDE_UPSERT").latest(
            "id_evento"
        )
        self.assertEqual(event.resultado, AuditoriaEvento.Resultado.SUCCESS)
        self.assertEqual(event.recurso_id, self.target_user.id_usuario)
        self.assertEqual(event.target_usuario_id, self.target_user.id_usuario)
        self.assertEqual(event.meta.get("source"), "legacy")

    def test_override_upsert_user_not_found_records_failed_audit_event(self):
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
        event = AuditoriaEvento.objects.filter(accion="RBAC_USER_OVERRIDE_UPSERT").latest(
            "id_evento"
        )
        self.assertEqual(event.resultado, AuditoriaEvento.Resultado.FAIL)
        self.assertEqual(event.codigo_error, "USER_NOT_FOUND")
        self.assertEqual(event.recurso_id, 999999)

    def test_override_same_day_past_time_remains_active_until_day_end(self):
        now_local = timezone.make_aware(
            datetime(2030, 1, 6, 22, 0, 0),
            timezone.get_current_timezone(),
        )

        with patch("apps.administracion.views.rbac_views.timezone.now", return_value=now_local):
            upsert_response = self.client.post(
                f"/api/v1/users/{self.target_user.id_usuario}/overrides",
                {
                    "permissionCode": self.override_permission.codigo,
                    "effect": "ALLOW",
                    "expiresAt": "2030-01-06T08:00:00-06:00",
                },
                format="json",
                HTTP_X_CSRF_TOKEN=self.csrf_token,
            )

        self.assertEqual(upsert_response.status_code, status.HTTP_200_OK)
        self.assertFalse(upsert_response.data["overrides"][0]["isExpired"])

        after_end_of_day = now_local + timedelta(hours=3)
        with patch("apps.administracion.views.rbac_views.timezone.now", return_value=after_end_of_day):
            detail_response = self.client.get(f"/api/v1/users/{self.target_user.id_usuario}")

        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertTrue(detail_response.data["overrides"][0]["isExpired"])

    def test_override_is_expired_when_now_equals_expires_at(self):
        fixed_now = timezone.make_aware(
            datetime(2030, 1, 7, 12, 0, 0),
            timezone.get_current_timezone(),
        )
        RelUsuarioOverride.objects.create(
            id_usuario=self.target_user,
            id_permiso=self.override_permission,
            efecto="ALLOW",
            fch_expira=fixed_now,
            usr_asignacion=self.admin,
        )

        with patch("apps.administracion.views.rbac_views.timezone.now", return_value=fixed_now):
            response = self.client.get(f"/api/v1/users/{self.target_user.id_usuario}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["overrides"][0]["isExpired"])

    def test_override_endpoints_require_csrf_for_authorized_actor(self):
        upsert_response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides",
            {
                "permissionCode": self.override_permission.codigo,
                "effect": "ALLOW",
            },
            format="json",
        )

        self.assertEqual(upsert_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(upsert_response.data["code"], "PERMISSION_DENIED")

        remove_response = self.client.delete(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides/{self.override_permission.codigo}",
        )

        self.assertEqual(remove_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(remove_response.data["code"], "PERMISSION_DENIED")

    def test_override_upsert_blocks_self_override_without_wildcard(self):
        users_update = self._ensure_permission(
            "admin:gestion:usuarios:update",
            "Actualizar usuarios",
        )
        users_read = self._ensure_permission(
            "admin:gestion:usuarios:read",
            "Leer usuarios",
        )
        roles_update = self._ensure_permission(
            "admin:gestion:roles:update",
            "Actualizar roles",
        )

        limited_role = CatRol.objects.create(
            rol="LIMITED_USERS_OVERRIDE_SELF",
            desc_rol="Gestor usuarios sin wildcard",
            landing_route="/admin/users",
            is_active=True,
        )
        RelUsuarioRol.objects.create(id_usuario=self.target_user, id_rol=limited_role, is_primary=False)
        RelUsuarioRol.objects.create(id_usuario=self.admin, id_rol=limited_role, is_primary=False)

        limited_actor = SyUsuario.objects.create(
            usuario="limited_override_self",
            correo="limited.override.self@example.com",
            clave_hash=make_password("Limited_123456"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=limited_actor,
            nombre="Limited",
            paterno="Self",
            materno="",
            nombre_completo="Limited Self",
        )
        RelUsuarioRol.objects.create(id_usuario=limited_actor, id_rol=limited_role, is_primary=True)

        RelRolPermiso.objects.create(id_rol=limited_role, id_permiso=users_update)
        RelRolPermiso.objects.create(id_rol=limited_role, id_permiso=users_read)

        self._login_as("limited_override_self", "Limited_123456")

        response = self.client.post(
            f"/api/v1/users/{limited_actor.id_usuario}/overrides",
            {
                "permissionCode": roles_update.codigo,
                "effect": "ALLOW",
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "SELF_OVERRIDE_FORBIDDEN")
        self.assertFalse(
            RelUsuarioOverride.objects.filter(
                id_usuario=limited_actor,
                id_permiso=roles_update,
                fch_baja__isnull=True,
            ).exists()
        )

    def test_override_upsert_blocks_permission_outside_actor_scope(self):
        users_update = self._ensure_permission(
            "admin:gestion:usuarios:update",
            "Actualizar usuarios",
        )
        users_read = self._ensure_permission(
            "admin:gestion:usuarios:read",
            "Leer usuarios",
        )
        roles_update = self._ensure_permission(
            "admin:gestion:roles:update",
            "Actualizar roles",
        )

        limited_role = CatRol.objects.create(
            rol="LIMITED_USERS_OVERRIDE_SCOPE",
            desc_rol="Gestor usuarios scope limitado",
            landing_route="/admin/users",
            is_active=True,
        )

        RelRolPermiso.objects.create(id_rol=limited_role, id_permiso=users_update)
        RelRolPermiso.objects.create(id_rol=limited_role, id_permiso=users_read)

        limited_actor = SyUsuario.objects.create(
            usuario="limited_override_scope",
            correo="limited.override.scope@example.com",
            clave_hash=make_password("Limited_123456"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=limited_actor,
            nombre="Limited",
            paterno="Scope",
            materno="",
            nombre_completo="Limited Scope",
        )
        RelUsuarioRol.objects.create(id_usuario=limited_actor, id_rol=limited_role, is_primary=True)

        self._login_as("limited_override_scope", "Limited_123456")

        response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides",
            {
                "permissionCode": roles_update.codigo,
                "effect": "ALLOW",
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "PERMISSION_GRANT_NOT_ALLOWED")
        self.assertFalse(
            RelUsuarioOverride.objects.filter(
                id_usuario=self.target_user,
                id_permiso=roles_update,
                fch_baja__isnull=True,
            ).exists()
        )

    def test_override_upsert_blocks_system_permission_without_wildcard(self):
        users_update = self._ensure_permission(
            "admin:gestion:usuarios:update",
            "Actualizar usuarios",
        )
        users_read = self._ensure_permission(
            "admin:gestion:usuarios:read",
            "Leer usuarios",
        )
        system_permission = self._ensure_permission(
            "admin:seguridad:sistema:read",
            "Permiso de sistema",
            is_system=True,
        )

        limited_role = CatRol.objects.create(
            rol="LIMITED_USERS_OVERRIDE_SYSTEM",
            desc_rol="Gestor usuarios sin permisos sistema",
            landing_route="/admin/users",
            is_active=True,
        )

        RelRolPermiso.objects.create(id_rol=limited_role, id_permiso=users_update)
        RelRolPermiso.objects.create(id_rol=limited_role, id_permiso=users_read)

        limited_actor = SyUsuario.objects.create(
            usuario="limited_override_system",
            correo="limited.override.system@example.com",
            clave_hash=make_password("Limited_123456"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=limited_actor,
            nombre="Limited",
            paterno="System",
            materno="",
            nombre_completo="Limited System",
        )
        RelUsuarioRol.objects.create(id_usuario=limited_actor, id_rol=limited_role, is_primary=True)

        self._login_as("limited_override_system", "Limited_123456")

        response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides",
            {
                "permissionCode": system_permission.codigo,
                "effect": "DENY",
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "PERMISSION_SYSTEM_PROTECTED")
        self.assertFalse(
            RelUsuarioOverride.objects.filter(
                id_usuario=self.target_user,
                id_permiso=system_permission,
                fch_baja__isnull=True,
            ).exists()
        )

    def test_override_remove_blocks_permission_outside_actor_scope(self):
        users_update = self._ensure_permission(
            "admin:gestion:usuarios:update",
            "Actualizar usuarios",
        )
        users_read = self._ensure_permission(
            "admin:gestion:usuarios:read",
            "Leer usuarios",
        )
        roles_update = self._ensure_permission(
            "admin:gestion:roles:update",
            "Actualizar roles",
        )

        limited_role = CatRol.objects.create(
            rol="LIMITED_USERS_OVERRIDE_REMOVE",
            desc_rol="Gestor usuarios remover override",
            landing_route="/admin/users",
            is_active=True,
        )

        RelRolPermiso.objects.create(id_rol=limited_role, id_permiso=users_update)
        RelRolPermiso.objects.create(id_rol=limited_role, id_permiso=users_read)

        limited_actor = SyUsuario.objects.create(
            usuario="limited_override_remove",
            correo="limited.override.remove@example.com",
            clave_hash=make_password("Limited_123456"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=limited_actor,
            nombre="Limited",
            paterno="Remove",
            materno="",
            nombre_completo="Limited Remove",
        )
        RelUsuarioRol.objects.create(id_usuario=limited_actor, id_rol=limited_role, is_primary=True)

        override = RelUsuarioOverride.objects.create(
            id_usuario=self.target_user,
            id_permiso=roles_update,
            efecto="ALLOW",
            usr_asignacion=self.admin,
        )

        self._login_as("limited_override_remove", "Limited_123456")

        response = self.client.delete(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides/{roles_update.codigo}",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "PERMISSION_GRANT_NOT_ALLOWED")
        override.refresh_from_db()
        self.assertIsNone(override.fch_baja)

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

        invalid_day_response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides",
            {
                "permissionCode": self.override_permission.codigo,
                "effect": "ALLOW",
                "expiresAt": "2030-02-30",
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )
        self.assertEqual(invalid_day_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(invalid_day_response.data["code"], "INVALID_FORMAT")

        invalid_hour_response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides",
            {
                "permissionCode": self.override_permission.codigo,
                "effect": "ALLOW",
                "expiresAt": "2030-01-03T24:00:00Z",
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )
        self.assertEqual(invalid_hour_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(invalid_hour_response.data["code"], "INVALID_FORMAT")

        out_of_range_response = self.client.post(
            f"/api/v1/users/{self.target_user.id_usuario}/overrides",
            {
                "permissionCode": self.override_permission.codigo,
                "effect": "ALLOW",
                "expiresAt": "9999-12-31T23:59:59Z",
            },
            format="json",
            HTTP_X_CSRF_TOKEN=self.csrf_token,
        )
        self.assertEqual(out_of_range_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(out_of_range_response.data["code"], "INVALID_FORMAT")

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
