from django.conf import settings


_READ_SOURCE_S1 = "s1"
_READ_SOURCE_LEGACY = "legacy"
_READ_SOURCE_AUTO = "auto"


def resolve_rbac_read_source() -> str:
    raw_source = str(
        getattr(settings, "RBAC_READ_SLICE_SOURCE", _READ_SOURCE_AUTO)
    ).strip().lower()

    if raw_source in {_READ_SOURCE_S1, _READ_SOURCE_LEGACY}:
        return raw_source

    if bool(getattr(settings, "RBAC_READ_S1_ENABLED", False)):
        return _READ_SOURCE_S1

    return _READ_SOURCE_LEGACY


def is_rbac_read_s1_enabled() -> bool:
    return resolve_rbac_read_source() == _READ_SOURCE_S1
