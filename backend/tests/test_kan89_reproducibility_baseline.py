from pathlib import Path

from django.test import SimpleTestCase

import seed_e2e


class Kan89ReproducibilityBaselineTests(SimpleTestCase):
    def test_seed_exports_explicit_kan89_subset(self):
        expected_usernames = {
            "admin",
            "usuario_inactivo_clinico",
            "usuario_bloqueado_clinico",
            "usuario_onboarding_clinico",
            "usuario_cambiar_clave_clinico",
        }

        self.assertEqual(
            set(seed_e2e.KAN89_REPRO_BASELINE_USERNAMES),
            expected_usernames,
        )

    def test_seed_subset_snapshot_is_deterministic(self):
        first_snapshot = seed_e2e.build_kan89_user_subset_snapshot()
        second_snapshot = seed_e2e.build_kan89_user_subset_snapshot()

        self.assertEqual(first_snapshot, second_snapshot)
        self.assertEqual(
            [entry["username"] for entry in first_snapshot],
            sorted([entry["username"] for entry in first_snapshot]),
        )

    def test_start_docker_uses_opt_in_e2e_seed_flag(self):
        script_path = Path(__file__).resolve().parents[1] / "start-docker.sh"
        script_content = script_path.read_text(encoding="utf-8")

        self.assertIn("RUN_E2E_SEED_ON_BOOT:-false", script_content)
        self.assertIn("python manage.py shell -c", script_content)
        self.assertIn("seed_e2e.run()", script_content)
