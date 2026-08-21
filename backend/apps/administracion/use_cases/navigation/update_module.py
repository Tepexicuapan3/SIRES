from django.core.exceptions import ValidationError as DjangoValidationError

from apps.administracion.models import Modulo
from apps.authentication.repositories.user_repository import UserRepository
from apps.catalogos.models import Permisos

from ...policies.navigation_module_mutation_policy import NavigationModuleMutationPolicy
from .exceptions import (
    NavigationModuleNotFoundError,
    NavigationModuleValidationError,
    NavigationPermissionNotFoundError,
    details_from_validation_error,
)

_SIMPLE_FIELDS = {
    "title": "titulo",
    "icon": "icono",
    "url": "url",
    "badge": "badge",
    "group": "grupo",
    "isSection": "es_seccion",
}


class UpdateModuleUseCase:
    """
    Actualiza los campos "simples" de un modulo (titulo/icono/url/badge/
    grupo/isSection/permissionCodes). Deliberadamente NO toca `parentKey`
    -- mover de padre es responsabilidad exclusiva de `MoveModuleUseCase`
    (invocado aparte por la view cuando el payload trae `parentKey`), para
    mantener una sola razon de cambio por use case.
    """

    def __init__(self, read_repository, mutation_repository):
        self.read_repository = read_repository
        self.mutation_repository = mutation_repository

    def execute(self, *, clave, data, actor):
        modulo = self.read_repository.get_by_clave(clave)
        if modulo is None:
            raise NavigationModuleNotFoundError(clave=clave)

        fields = {}
        if "title" in data:
            title = (data.get("title") or "").strip()
            if not title:
                raise NavigationModuleValidationError({"title": ["Campo requerido"]})
            fields["titulo"] = title
        if "group" in data:
            group = data.get("group")
            if group not in Modulo.Grupo.values:
                raise NavigationModuleValidationError(
                    {"group": [f"Debe ser uno de: {', '.join(Modulo.Grupo.values)}"]}
                )
            fields["grupo"] = group
        for payload_field, model_field in _SIMPLE_FIELDS.items():
            if payload_field in ("title", "group"):
                continue
            if payload_field in data:
                value = data.get(payload_field)
                if payload_field == "isSection":
                    value = bool(value)
                fields[model_field] = value

        try:
            if fields:
                self.mutation_repository.update_module(modulo, **fields)
        except DjangoValidationError as exc:
            raise NavigationModuleValidationError(details_from_validation_error(exc)) from exc

        if "permissionCodes" in data:
            codes = list(data.get("permissionCodes") or [])
            permission_ids = self._validate_permission_codes(codes, actor=actor)
            self.mutation_repository.set_permisos(modulo, permission_ids)

        return modulo

    def _validate_permission_codes(self, codes, *, actor):
        if not codes:
            return []

        permisos = list(Permisos.objects.filter(codigo__in=codes, is_active=True))
        found_codes = {permiso.codigo for permiso in permisos}
        missing = set(codes) - found_codes
        if missing:
            raise NavigationPermissionNotFoundError(missing)

        actor_permissions = set(UserRepository.build_auth_user(actor).get("permissions", []))
        NavigationModuleMutationPolicy.assert_can_grant(
            codes=codes, actor_permissions=actor_permissions
        )

        return [permiso.id_permiso for permiso in permisos]
