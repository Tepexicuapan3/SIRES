from __future__ import annotations

from typing import Iterable

from django.utils import timezone

from apps.authentication.models import SyUsuario

AUTH_REVISION_HEADER = "X-Auth-Revision"


def serialize_auth_revision(user: SyUsuario) -> str:
    base_revision = user.fch_modf or user.fch_alta or timezone.now()

    if timezone.is_naive(base_revision):
        base_revision = timezone.make_aware(base_revision, timezone.get_current_timezone())

    return timezone.localtime(base_revision).isoformat()


def touch_users_auth_revision(
    user_ids: Iterable[int],
    actor_id: int | None = None,
) -> None:
    unique_ids = sorted({int(user_id) for user_id in user_ids if user_id is not None})
    if not unique_ids:
        return

    now = timezone.now()
    update_fields = {"fch_modf": now}

    if actor_id is not None:
        update_fields["usr_modf_id"] = actor_id

    SyUsuario.objects.filter(id_usuario__in=unique_ids).update(**update_fields)


def touch_user_auth_revision(user: SyUsuario, actor_id: int | None = None) -> None:
    touch_users_auth_revision([user.id_usuario], actor_id=actor_id)
