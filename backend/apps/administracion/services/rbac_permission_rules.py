from apps.catalogos.models import Permisos


def split_permission_code(code):
    parts = code.split(":")
    if len(parts) < 2:
        return None, None
    return ":".join(parts[:-1]), parts[-1]


def ensure_read_dependencies(permission_ids):
    permissions = {
        permission.id_permiso: permission
        for permission in Permisos.objects.filter(
            id_permiso__in=permission_ids,
            is_active=True,
        )
    }
    expanded = set(permission_ids)

    by_code = {permission.codigo: permission for permission in permissions.values()}

    for permission in list(permissions.values()):
        resource, action = split_permission_code(permission.codigo)
        if action in {"create", "update", "delete"} and resource:
            read_code = f"{resource}:read"
            read_permission = by_code.get(read_code)
            if read_permission:
                expanded.add(read_permission.id_permiso)

    return expanded
