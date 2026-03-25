from django.test import SimpleTestCase

from apps.authentication.services.authorization_service import has_capability
from apps.authentication.services.permission_dependencies import (
    CAPABILITY_REQUIREMENTS,
)


class AuthorizationServiceTests(SimpleTestCase):
    def test_deny_by_default_when_permission_is_missing(self):
        self.assertFalse(
            has_capability([], "flow.somatometria.capture")
        )

    def test_allow_when_effective_permission_is_complete(self):
        self.assertTrue(
            has_capability(
                [
                    "clinico:somatometria:read",
                ],
                "flow.somatometria.capture",
            )
        )

    def test_single_change_point_updates_runtime_behavior(self):
        original_requirement = CAPABILITY_REQUIREMENTS["flow.somatometria.capture"]

        try:
            CAPABILITY_REQUIREMENTS["flow.somatometria.capture"] = {
                "allOf": ["clinico:somatometria:update"]
            }

            self.assertFalse(
                has_capability(
                    [
                        "clinico:somatometria:read",
                    ],
                    "flow.somatometria.capture",
                )
            )
        finally:
            CAPABILITY_REQUIREMENTS["flow.somatometria.capture"] = original_requirement
