from apps.administracion.use_cases.rbac_read.exceptions import RbacReadValidationError


def _parse_bool(raw_value):
    if raw_value is None:
        return None
    normalized = str(raw_value).strip().lower()
    if normalized in {"true", "1"}:
        return True
    if normalized in {"false", "0"}:
        return False
    return "invalid"


class ListRolesUseCase:
    def __init__(self, repository):
        self.repository = repository

    def execute(
        self,
        *,
        page,
        page_size,
        search=None,
        is_active_raw=None,
        is_system_raw=None,
        sort_by="name",
        sort_order="asc",
    ):
        is_active = _parse_bool(is_active_raw)
        if is_active == "invalid":
            raise RbacReadValidationError(
                "VALIDATION_ERROR",
                "Parametro isActive invalido",
                details={"isActive": ["Debe ser true o false"]},
            )

        is_system = _parse_bool(is_system_raw)
        if is_system == "invalid":
            raise RbacReadValidationError(
                "VALIDATION_ERROR",
                "Parametro isSystem invalido",
                details={"isSystem": ["Debe ser true o false"]},
            )

        if sort_by not in self.repository.SORT_MAP:
            raise RbacReadValidationError(
                "VALIDATION_ERROR",
                "Parametro sortBy invalido",
                details={"sortBy": ["Campo invalido"]},
            )

        if sort_order not in {"asc", "desc"}:
            raise RbacReadValidationError(
                "VALIDATION_ERROR",
                "Parametro sortOrder invalido",
                details={"sortOrder": ["Debe ser asc o desc"]},
            )

        return self.repository.list_roles(
            page=page,
            page_size=page_size,
            search=search,
            is_active=is_active,
            is_system=is_system,
            sort_by=sort_by,
            sort_order=sort_order,
        )
