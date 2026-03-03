from django.test import SimpleTestCase

from apps.authentication.services.permission_dependencies import (
    build_permission_context,
    evaluate_permission_dependencies,
    get_permission_dependency_closure,
)


class PermissionDependenciesServiceTests(SimpleTestCase):
    def test_users_update_dependency_closure(self):
        closure = get_permission_dependency_closure("admin:gestion:usuarios:update")

        self.assertEqual(
            closure,
            [
                "admin:gestion:permisos:read",
                "admin:gestion:roles:read",
                "admin:gestion:usuarios:read",
                "admin:gestion:usuarios:update",
            ],
        )

    def test_incomplete_dependency_chain_is_not_granted(self):
        state = evaluate_permission_dependencies(
            "admin:gestion:usuarios:update",
            [
                "admin:gestion:usuarios:update",
                "admin:gestion:usuarios:read",
            ],
        )

        self.assertFalse(state["granted"])
        self.assertEqual(
            state["missingPermissions"],
            ["admin:gestion:permisos:read", "admin:gestion:roles:read"],
        )

    def test_permission_context_projects_effective_permissions(self):
        context = build_permission_context(
            [
                "admin:gestion:usuarios:update",
                "admin:gestion:usuarios:read",
            ]
        )

        self.assertEqual(
            context["effectivePermissions"],
            ["admin:gestion:usuarios:read"],
        )
        self.assertFalse(context["capabilities"]["admin.users.update"]["granted"])
        self.assertTrue(context["capabilities"]["admin.users.read"]["granted"])

    def test_permission_context_with_wildcard_marks_capabilities_as_granted(self):
        context = build_permission_context(["*"])

        self.assertEqual(context["effectivePermissions"], ["*"])
        self.assertTrue(context["capabilities"]["admin.users.editFull"]["granted"])

    def test_flow_somatometria_capabilities_resolve_from_clinico_permission(self):
        context = build_permission_context(["clinico:somatometria:read"])

        self.assertTrue(context["capabilities"]["flow.somatometria.queue.read"]["granted"])
        self.assertTrue(context["capabilities"]["flow.somatometria.capture"]["granted"])
        self.assertTrue(context["capabilities"]["flow.visits.queue.read"]["granted"])

    def test_flow_doctor_capabilities_resolve_from_consultas_permission(self):
        context = build_permission_context(["clinico:consultas:read"])

        self.assertTrue(context["capabilities"]["flow.doctor.queue.read"]["granted"])
        self.assertTrue(
            context["capabilities"]["flow.doctor.consultation.start"]["granted"]
        )
        self.assertTrue(
            context["capabilities"]["flow.doctor.consultation.close"]["granted"]
        )

    def test_flow_visits_queue_capability_requires_dependency_complete(self):
        context = build_permission_context(["recepcion:fichas:medicina_general:create"])

        self.assertFalse(context["capabilities"]["flow.visits.queue.read"]["granted"])
        self.assertFalse(context["capabilities"]["flow.somatometria.capture"]["granted"])

        complete_context = build_permission_context(
            [
                "recepcion:fichas:medicina_general:create",
                "recepcion:fichas:medicina_general:read",
            ]
        )

        self.assertTrue(complete_context["capabilities"]["flow.visits.queue.read"]["granted"])

    def test_flow_recepcion_write_capability_requires_dependency_complete(self):
        context = build_permission_context(["recepcion:fichas:especialidad:create"])

        self.assertFalse(context["capabilities"]["flow.recepcion.queue.write"]["granted"])

        complete_context = build_permission_context(
            [
                "recepcion:fichas:especialidad:create",
                "recepcion:fichas:especialidad:read",
            ]
        )

        self.assertTrue(
            complete_context["capabilities"]["flow.recepcion.queue.write"]["granted"]
        )
