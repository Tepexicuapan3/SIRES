from typing import List

from apps.authentication.services.permission_dependencies import (
    CAPABILITY_REQUIREMENTS,
    PermissionRequirementState,
    build_permission_context,
    evaluate_permission_requirement,
)


def get_permission_context(granted_permissions: List[str]):
    return build_permission_context(granted_permissions)


def get_capability_state(
    granted_permissions: List[str], capability_key: str
) -> PermissionRequirementState:
    requirement = CAPABILITY_REQUIREMENTS.get(capability_key)
    if requirement is None:
        return {
            "granted": False,
            "missingAllOf": [],
            "missingAnyOf": [],
        }

    return evaluate_permission_requirement(requirement, granted_permissions)


def has_capability(granted_permissions: List[str], capability_key: str) -> bool:
    state = get_capability_state(granted_permissions, capability_key)
    return state["granted"]
