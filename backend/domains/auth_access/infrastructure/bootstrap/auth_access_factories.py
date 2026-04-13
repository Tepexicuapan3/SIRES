from __future__ import annotations

import random

from django.db import transaction

from apps.administracion.models import RelUsuarioOverride
from apps.catalogos.models import Permisos, Roles

from .auth_access_seeders import (
    SeedSummary,
    _assign_permission_to_role,
    _assign_role_to_user,
    _create_override,
    _upsert_permission,
    _upsert_role,
    _upsert_user,
    ensure_base_permissions,
)


@transaction.atomic
def generate_auth_access_users(*, amount: int, random_seed: int = 42) -> SeedSummary:
    if amount <= 0:
        return SeedSummary()

    randomizer = random.Random(random_seed)
    summary = SeedSummary()

    roles = list(Roles.objects.filter(is_active=True))
    if not roles:
        roles_to_create = (
            ("admin", "Administrador", "/admin", True),
            ("user", "Usuario", "/dashboard", False),
            ("support", "Soporte", "/dashboard", False),
        )
        created_roles = 0
        for role_name, description, landing_route, is_admin in roles_to_create:
            role, created = _upsert_role(
                name=role_name,
                description=description,
                landing_route=landing_route,
                is_admin=is_admin,
            )
            created_roles += int(created)
            roles.append(role)
        summary = summary.merge(SeedSummary(created_roles=created_roles))

    permissions = list(Permisos.objects.filter(is_active=True))
    if not permissions:
        permissions = list(ensure_base_permissions())
        summary = summary.merge(SeedSummary(created_permissions=len(permissions)))

    # Ensure every active role has at least one permission.
    created_role_permissions = 0
    for role in roles:
        selected_permissions = randomizer.sample(
            permissions, k=min(len(permissions), randomizer.randint(1, 2))
        )
        for permission in selected_permissions:
            if _assign_permission_to_role(role=role, permission=permission):
                created_role_permissions += 1

    summary = summary.merge(
        SeedSummary(created_role_permissions=created_role_permissions)
    )

    created_users = 0
    created_user_roles = 0
    created_overrides = 0
    for index in range(1, amount + 1):
        username = f"factory_user_{index:03d}"
        email = f"factory.user.{index:03d}@example.com"
        user, user_created = _upsert_user(
            username=username,
            email=email,
            raw_password="Factory_123456",
            force_change_password=False,
        )
        created_users += int(user_created)

        selected_roles = randomizer.sample(
            roles, k=min(len(roles), randomizer.randint(1, 2))
        )
        for role_index, role in enumerate(selected_roles):
            if _assign_role_to_user(user=user, role=role, is_primary=role_index == 0):
                created_user_roles += 1

        if randomizer.random() < 0.25:
            override_permission = randomizer.choice(permissions)
            effect = randomizer.choice(
                [
                    RelUsuarioOverride.Efecto.ALLOW,
                    RelUsuarioOverride.Efecto.DENY,
                ]
            )
            if _create_override(
                user=user, permission=override_permission, efecto=effect
            ):
                created_overrides += 1

    summary = summary.merge(
        SeedSummary(
            created_users=created_users,
            created_user_roles=created_user_roles,
            created_overrides=created_overrides,
        )
    )
    return summary
