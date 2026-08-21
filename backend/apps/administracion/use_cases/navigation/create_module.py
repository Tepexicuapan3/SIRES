import re
import unicodedata

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


def _slugify(value):
    """
    Slug ascii, minusculas, `_` como separador -- el mismo alfabeto que ya
    usan las claves existentes (`administracion.catalogos.tipo_personal`).
    """
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "_", value).strip("_")
    return value or "modulo"


class CreateModuleUseCase:
    """
    Deriva `clave` en el SERVIDOR (autoridad de la unicidad, via el
    `unique=True` de `Modulo.clave`) a partir del titulo y la clave del
    padre, con sufijo anti-colision automatico -- nunca rechaza una
    creacion por choque de clave, simplemente la desambigua (mismo espiritu
    que "nodos sin permiso: nunca se bloquea la creacion").
    """

    def __init__(self, read_repository, mutation_repository):
        self.read_repository = read_repository
        self.mutation_repository = mutation_repository

    def execute(self, *, data, actor):
        title = (data.get("title") or "").strip()
        if not title:
            raise NavigationModuleValidationError({"title": ["Campo requerido"]})

        group = data.get("group") or Modulo.Grupo.PRIMARY
        if group not in Modulo.Grupo.values:
            raise NavigationModuleValidationError(
                {"group": [f"Debe ser uno de: {', '.join(Modulo.Grupo.values)}"]}
            )

        is_section = bool(data.get("isSection", False))
        icon = data.get("icon") or None
        url = data.get("url") or None
        badge = data.get("badge") or None
        permission_codes = list(data.get("permissionCodes") or [])

        parent = None
        parent_key = data.get("parentKey")
        if parent_key:
            parent = self.read_repository.get_by_clave(parent_key)
            if parent is None:
                raise NavigationModuleNotFoundError(clave=parent_key, field="parentKey")

        permission_ids = self._validate_permission_codes(
            permission_codes, actor=actor
        )

        clave = self._derive_key(title=title, parent_clave=parent.clave if parent else None)

        sibling_ids = self.read_repository.sibling_ids(parent.id_modulo if parent else None)
        orden = (len(sibling_ids) + 1) * 10

        try:
            modulo = self.mutation_repository.create_module(
                clave=clave,
                titulo=title,
                icono=icon,
                url=url,
                badge=badge,
                orden=orden,
                es_seccion=is_section,
                grupo=group,
                parent=parent,
            )
        except DjangoValidationError as exc:
            raise NavigationModuleValidationError(details_from_validation_error(exc)) from exc

        if permission_ids:
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

    def _derive_key(self, *, title, parent_clave):
        base_slug = _slugify(title)
        base_clave = f"{parent_clave}.{base_slug}" if parent_clave else base_slug

        clave = base_clave
        suffix = 2
        while self.read_repository.get_by_clave(clave) is not None:
            clave = f"{base_clave}_{suffix}"
            suffix += 1
        return clave
