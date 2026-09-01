from django.core.management import call_command
from django.test import TestCase

from apps.administracion.models import RelRolPermiso, RelUsuarioRol
from apps.authentication.models import SyUsuario
from apps.catalogos.models import (
    CatCentroAtencion,
    CatCentroAtencionHorario,
    Permisos,
    Roles,
    Turnos,
)


class SeedAuthAccessCommandTests(TestCase):
    def test_base_seed_creates_minimum_auth_access_data(self):
        call_command("seed_auth_access", "--base", "--admin-password", "Admin_123456")

        self.assertTrue(Roles.objects.filter(rol="admin").exists())
        self.assertTrue(Roles.objects.filter(rol="user").exists())

        admin_role = Roles.objects.get(rol="admin")
        admin_user = SyUsuario.objects.get(usuario="admin")

        self.assertEqual(admin_user.correo, "tepexicuapandavid3@gmail.com")
        self.assertTrue(
            RelUsuarioRol.objects.filter(
                id_usuario=admin_user, id_rol=admin_role, is_primary=True
            ).exists()
        )

        for code in ("read_users", "write_users", "delete_users", "manage_roles"):
            permission = Permisos.objects.get(codigo=code)
            self.assertTrue(
                RelRolPermiso.objects.filter(
                    id_rol=admin_role, id_permiso=permission
                ).exists()
            )

    def test_demo_seed_is_independent(self):
        call_command("seed_auth_access", "--demo")

        self.assertTrue(Roles.objects.filter(rol="support").exists())
        self.assertTrue(Roles.objects.filter(rol="auditor").exists())
        self.assertTrue(SyUsuario.objects.filter(usuario="demo_support").exists())
        self.assertTrue(SyUsuario.objects.filter(usuario="demo_auditor").exists())

    def test_edge_cases_seed_is_independent(self):
        call_command("seed_auth_access", "--edge-cases")

        edge_user = SyUsuario.objects.get(usuario="edge_no_role")
        self.assertFalse(RelUsuarioRol.objects.filter(id_usuario=edge_user).exists())

        self.assertTrue(
            Roles.objects.filter(rol="edge_role_without_permissions").exists()
        )
        self.assertTrue(
            Permisos.objects.filter(codigo="edge_orphan_permission").exists()
        )

    def test_factory_generation_creates_requested_volume(self):
        call_command("seed_auth_access", "--base", "--factory-users", "6")

        generated = SyUsuario.objects.filter(
            usuario__startswith="factory_user_"
        ).count()
        self.assertEqual(generated, 6)

    def test_seed_flows_do_not_mutate_cross_domain_centers_catalog(self):
        center = CatCentroAtencion.objects.create(
            name="Centro Contrato",
            code="CTR-CONTRACT-001",
            center_type=CatCentroAtencion.TipoCentro.CLINICA,
            is_external=False,
            address="Calle Contrato 123",
        )
        shift = Turnos.objects.create(name="Matutino")
        schedule = CatCentroAtencionHorario.objects.create(
            center=center,
            shift=shift,
            week_day=CatCentroAtencionHorario.DiaSemana.LUNES,
            is_open=True,
            is_24_hours=False,
            opening_time="08:00",
            closing_time="14:00",
        )

        before_centers_snapshot = list(
            CatCentroAtencion.objects.order_by("id").values_list(
                "id", "name", "code", "is_external", "address"
            )
        )
        before_schedules_snapshot = list(
            CatCentroAtencionHorario.objects.order_by("id").values_list(
                "id", "center_id", "shift_id", "week_day", "opening_time", "closing_time"
            )
        )

        call_command(
            "seed_auth_access",
            "--base",
            "--demo",
            "--edge-cases",
            "--factory-users",
            "2",
        )

        after_centers_snapshot = list(
            CatCentroAtencion.objects.order_by("id").values_list(
                "id", "name", "code", "is_external", "address"
            )
        )
        after_schedules_snapshot = list(
            CatCentroAtencionHorario.objects.order_by("id").values_list(
                "id", "center_id", "shift_id", "week_day", "opening_time", "closing_time"
            )
        )

        self.assertEqual(before_centers_snapshot, after_centers_snapshot)
        self.assertEqual(before_schedules_snapshot, after_schedules_snapshot)
        self.assertTrue(CatCentroAtencion.objects.filter(id=center.id).exists())
        self.assertTrue(CatCentroAtencionHorario.objects.filter(id=schedule.id).exists())
