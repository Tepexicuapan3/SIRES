from typing import Dict, List, TypedDict


class PermissionDependencyState(TypedDict):
    granted: bool
    requiredPermissions: List[str]
    missingPermissions: List[str]


class PermissionRequirement(TypedDict, total=False):
    allOf: List[str]
    anyOf: List[str]


class PermissionRequirementState(TypedDict):
    granted: bool
    missingAllOf: List[str]
    missingAnyOf: List[str]


WRITE_ACTIONS = {
    "create",
    "update",
    "delete",
    "manage",
    "assign",
    "revoke",
}


EXPLICIT_PERMISSION_DEPENDENCIES: Dict[str, List[str]] = {
    "admin:gestion:usuarios:create": ["admin:gestion:roles:read"],
    "admin:gestion:usuarios:update": [
        "admin:gestion:roles:read",
        "admin:gestion:permisos:read",
    ],
    "admin:gestion:roles:create": ["admin:gestion:permisos:read"],
    "admin:gestion:roles:update": ["admin:gestion:permisos:read"],
}


CAPABILITY_REQUIREMENTS: Dict[str, PermissionRequirement] = {
    "admin.users.read": {"allOf": ["admin:gestion:usuarios:read"]},
    "admin.users.create": {"allOf": ["admin:gestion:usuarios:create"]},
    "admin.users.update": {"allOf": ["admin:gestion:usuarios:update"]},
    "admin.users.rolesCatalog.read": {"allOf": ["admin:gestion:roles:read"]},
    "admin.users.permissionsCatalog.read": {
        "allOf": ["admin:gestion:permisos:read"]
    },
    "admin.users.editFull": {
        "allOf": [
            "admin:gestion:usuarios:read",
            "admin:gestion:usuarios:update",
            "admin:gestion:roles:read",
            "admin:gestion:permisos:read",
        ]
    },
    "admin.roles.read": {"allOf": ["admin:gestion:roles:read"]},
    "admin.roles.create": {"allOf": ["admin:gestion:roles:create"]},
    "admin.roles.update": {"allOf": ["admin:gestion:roles:update"]},
    "admin.roles.delete": {"allOf": ["admin:gestion:roles:delete"]},
    "admin.roles.permissionsCatalog.read": {
        "allOf": ["admin:gestion:permisos:read"]
    },
    "admin.roles.editFull": {
        "allOf": [
            "admin:gestion:roles:read",
            "admin:gestion:roles:update",
            "admin:gestion:permisos:read",
        ]
    },
    "admin.catalogs.areas.read": {"allOf": ["admin:catalogos:areas:read"]},
    "admin.catalogs.areas.create": {
        "allOf": ["admin:catalogos:areas:create"]
    },
    "admin.catalogs.areas.update": {
        "allOf": ["admin:catalogos:areas:update"]
    },
    "admin.catalogs.areas.delete": {
        "allOf": ["admin:catalogos:areas:delete"]
    },
    "admin.catalogs.centers.read": {
        "allOf": ["admin:catalogos:centros_atencion:read"]
    },
    "admin.catalogs.centers.create": {
        "allOf": ["admin:catalogos:centros_atencion:create"]
    },
    "admin.catalogs.centers.update": {
        "allOf": ["admin:catalogos:centros_atencion:update"]
    },
    "admin.catalogs.centers.delete": {
        "allOf": ["admin:catalogos:centros_atencion:delete"]
    },
    "admin.catalogs.escolaridad.read": {"allOf": ["admin:catalogos:escolaridad:read"]},
    "admin.catalogs.escolaridad.create": {"allOf": ["admin:catalogos:escolaridad:create"]},
    "admin.catalogs.escolaridad.update": {"allOf": ["admin:catalogos:escolaridad:update"]},
    "admin.catalogs.escolaridad.delete": {"allOf": ["admin:catalogos:escolaridad:delete"]},
    "admin.catalogs.tipo-personal.read": {"allOf": ["admin:catalogos:tipo_personal:read"]},
    "admin.catalogs.tipo-personal.create": {"allOf": ["admin:catalogos:tipo_personal:create"]},
    "admin.catalogs.tipo-personal.update": {"allOf": ["admin:catalogos:tipo_personal:update"]},
    "admin.catalogs.tipo-personal.delete": {"allOf": ["admin:catalogos:tipo_personal:delete"]},
    "admin.catalogs.tiposAreas.read": {"allOf": ["admin:catalogos:tipos_areas:read"]},
    "admin.catalogs.tiposAreas.create": {"allOf": ["admin:catalogos:tipos_areas:create"]},
    "admin.catalogs.tiposAreas.update": {"allOf": ["admin:catalogos:tipos_areas:update"]},
    "admin.catalogs.tiposAreas.delete": {"allOf": ["admin:catalogos:tipos_areas:delete"]},
    "admin.catalogs.tipos-citas.read": {"allOf": ["admin:catalogos:tipo_citas:read"]},
    "admin.catalogs.tipos-citas.create": {"allOf": ["admin:catalogos:tipo_citas:create"]},
    "admin.catalogs.tipos-citas.update": {"allOf": ["admin:catalogos:tipo_citas:update"]},
    "admin.catalogs.tipos-citas.delete": {"allOf": ["admin:catalogos:tipo_citas:delete"]},
    "admin.catalogs.escuelas.read": {"allOf": ["admin:catalogos:escuelas:read"]},
    "admin.catalogs.escuelas.create": {"allOf": ["admin:catalogos:escuelas:create"]},
    "admin.catalogs.escuelas.update": {"allOf": ["admin:catalogos:escuelas:update"]},
    "admin.catalogs.escuelas.delete": {"allOf": ["admin:catalogos:escuelas:delete"]},
    "admin.catalogs.sucursales.read": {"allOf": ["admin:catalogos:sucursales:read"]},
    "admin.catalogs.sucursales.create": {"allOf": ["admin:catalogos:sucursales:create"]},
    "admin.catalogs.sucursales.update": {"allOf": ["admin:catalogos:sucursales:update"]},
    "admin.catalogs.sucursales.delete": {"allOf": ["admin:catalogos:sucursales:delete"]},
    "admin.catalogs.turnos.read": {"allOf": ["admin:catalogos:turnos:read"]},
    "admin.catalogs.turnos.create": {"allOf": ["admin:catalogos:turnos:create"]},
    "admin.catalogs.turnos.update": {"allOf": ["admin:catalogos:turnos:update"]},
    "admin.catalogs.turnos.delete": {"allOf": ["admin:catalogos:turnos:delete"]},
    "admin.catalogs.vacunas.read": {"allOf": ["admin:catalogos:vacunas:read"]},
    "admin.catalogs.vacunas.create": {"allOf": ["admin:catalogos:vacunas:create"]},
    "admin.catalogs.vacunas.update": {"allOf": ["admin:catalogos:vacunas:update"]},
    "admin.catalogs.vacunas.delete": {"allOf": ["admin:catalogos:vacunas:delete"]},
    "admin.catalogs.areas_clinicas.read": {"allOf": ["admin:catalogos:areas_clinicas:read"]},
    "admin.catalogs.areas_clinicas.create": {"allOf": ["admin:catalogos:areas_clinicas:create"]},
    "admin.catalogs.areas_clinicas.update": {"allOf": ["admin:catalogos:areas_clinicas:update"]},
    "admin.catalogs.areas_clinicas.delete": {"allOf": ["admin:catalogos:areas_clinicas:delete"]},
    "admin.catalogs.centroAreaClinica.read": {"allOf": ["admin:catalogos:centro_area_clinica:read"]},
    "admin.catalogs.centroAreaClinica.create": {"allOf": ["admin:catalogos:centro_area_clinica:create"]},
    "admin.catalogs.centroAreaClinica.update": {"allOf": ["admin:catalogos:centro_area_clinica:update"]},
    "admin.catalogs.centroAreaClinica.delete": {"allOf": ["admin:catalogos:centro_area_clinica:delete"]},
    "admin.catalogs.especialidades.read": {"allOf": ["admin:catalogos:especialidades:read"]},
    "admin.catalogs.especialidades.create": {"allOf": ["admin:catalogos:especialidades:create"]},
    "admin.catalogs.especialidades.update": {"allOf": ["admin:catalogos:especialidades:update"]},
    "admin.catalogs.especialidades.delete": {"allOf": ["admin:catalogos:especialidades:delete"]},
    "admin.catalogs.edo_civil.read": {"allOf": ["admin:catalogos:edo_civil:read"]},
    "admin.catalogs.edo_civil.create": {"allOf": ["admin:catalogos:edo_civil:create"]},
    "admin.catalogs.edo_civil.update": {"allOf": ["admin:catalogos:edo_civil:update"]},
    "admin.catalogs.edo_civil.delete": {"allOf": ["admin:catalogos:edo_civil:delete"]},
    "admin.catalogs.cies.upload": {"allOf": ["admin:catalogos:cies:upload"]},
    # Gestion de menus (arbol de navegacion / cat_modulos)
    "admin.menus.read": {"allOf": ["admin:gestion:modulos:read"]},
    "admin.menus.create": {"allOf": ["admin:gestion:modulos:create"]},
    "admin.menus.update": {"allOf": ["admin:gestion:modulos:update"]},
    "admin.menus.delete": {"allOf": ["admin:gestion:modulos:delete"]},
    # Médicos
    "admin.medicos.read":        {"allOf": ["admin:gestion:medicos:read"]},
    "admin.medicos.create":      {"allOf": ["admin:gestion:medicos:create"]},
    "admin.medicos.update":      {"allOf": ["admin:gestion:medicos:update"]},
    "admin.medicos.horarios":    {"allOf": ["admin:gestion:medicos:horarios"]},
    "admin.medicos.excepciones": {"allOf": ["admin:gestion:medicos:excepciones"]},
    "admin.medicos.coberturas":  {"allOf": ["admin:gestion:medicos:coberturas"]},
    "farmacia.vacunas.read": {"allOf": ["farmacia:vacunas:read"]},
    "farmacia.vacunas.create": {"allOf": ["farmacia:vacunas:create"]},
    "farmacia.vacunas.update": {"allOf": ["farmacia:vacunas:update"]},
    "farmacia.vacunas.delete": {"allOf": ["farmacia:vacunas:delete"]},
    "flow.visits.queue.read": {
        "anyOf": [
            "recepcion:fichas:medicina_general:create",
            "recepcion:fichas:especialidad:create",
            "recepcion:fichas:urgencias:create",
            "clinico:consultas:read",
            "clinico:somatometria:read",
        ]
    },
    "flow.recepcion.queue.write": {
        "anyOf": [
            "recepcion:fichas:medicina_general:create",
            "recepcion:fichas:especialidad:create",
            "recepcion:fichas:urgencias:create",
        ]
    },
    "flow.somatometria.queue.read": {
        "allOf": ["clinico:somatometria:read"]
    },
    "flow.somatometria.capture": {
        "allOf": ["clinico:somatometria:read"]
    },
    "flow.doctor.queue.read": {
        "allOf": ["clinico:consultas:read"]
    },
    "flow.doctor.consultation.start": {
        "allOf": ["clinico:consultas:read"]
    },
    "flow.doctor.consultation.close": {
        "allOf": ["clinico:consultas:read"]
    },
    # ── Citas médicas ──────────────────────────────────────────────────────────
    "recepcion:citas:read": {
        "allOf": ["recepcion:citas:read"]
    },
    "recepcion:citas:write": {
        "allOf": ["recepcion:citas:write"]
    },
}


STRICT_CAPABILITY_PREFIXES: List[str] = [
    "flow.recepcion.",
    "flow.somatometria.",
    "flow.visits.",
]


def _normalize_permission(permission_code: str) -> str:
    return permission_code.strip()


def _merge_unique(values: List[str]) -> List[str]:
    return sorted(set(values))


def _infer_read_dependency(permission_code: str):
    segments = [segment.strip() for segment in permission_code.split(":")]
    if len(segments) < 2:
        return None

    action = segments[-1].lower()
    if action not in WRITE_ACTIONS:
        return None

    read_segments = [*segments]
    read_segments[-1] = "read"
    return ":".join(read_segments)


def get_permission_direct_dependencies(permission_code: str) -> List[str]:
    normalized_permission = _normalize_permission(permission_code)
    if not normalized_permission:
        return []

    explicit = EXPLICIT_PERMISSION_DEPENDENCIES.get(normalized_permission, [])
    dependencies = set(explicit)

    inferred = _infer_read_dependency(normalized_permission)
    if inferred and inferred != normalized_permission:
        dependencies.add(inferred)

    return sorted(dependencies)


def get_permission_dependency_closure(permission_code: str) -> List[str]:
    normalized_permission = _normalize_permission(permission_code)
    if not normalized_permission:
        return []

    visited = set()
    stack = [normalized_permission]

    while stack:
        current = stack.pop()
        if not current or current in visited:
            continue

        visited.add(current)

        for dependency in get_permission_direct_dependencies(current):
            if dependency not in visited:
                stack.append(dependency)

    return sorted(visited)


def evaluate_permission_dependencies(
    permission_code: str,
    granted_permissions: List[str],
) -> PermissionDependencyState:
    normalized_permission = _normalize_permission(permission_code)
    if not normalized_permission:
        return {
            "granted": False,
            "requiredPermissions": [],
            "missingPermissions": [],
        }

    if "*" in granted_permissions:
        return {
            "granted": True,
            "requiredPermissions": [normalized_permission],
            "missingPermissions": [],
        }

    granted = set(granted_permissions)
    required_permissions = get_permission_dependency_closure(normalized_permission)
    missing_permissions = [
        permission for permission in required_permissions if permission not in granted
    ]

    return {
        "granted": len(missing_permissions) == 0,
        "requiredPermissions": required_permissions,
        "missingPermissions": missing_permissions,
    }


def evaluate_permission_requirement(
    requirement: PermissionRequirement,
    granted_permissions: List[str],
) -> PermissionRequirementState:
    all_of = requirement.get("allOf", [])
    any_of = requirement.get("anyOf", [])

    all_states = [
        evaluate_permission_dependencies(permission, granted_permissions)
        for permission in all_of
    ]
    missing_all_of = _merge_unique(
        [
            missing
            for state in all_states
            for missing in state["missingPermissions"]
        ]
    )

    any_states = [
        evaluate_permission_dependencies(permission, granted_permissions)
        for permission in any_of
    ]
    has_any = len(any_states) == 0 or any(state["granted"] for state in any_states)
    missing_any_of = (
        []
        if has_any
        else _merge_unique(
            [
                required
                for state in any_states
                for required in state["requiredPermissions"]
            ]
        )
    )

    return {
        "granted": len(missing_all_of) == 0 and has_any,
        "missingAllOf": missing_all_of,
        "missingAnyOf": missing_any_of,
    }


def project_effective_permissions(granted_permissions: List[str]) -> List[str]:
    if "*" in granted_permissions:
        return ["*"]

    effective = []
    for permission in granted_permissions:
        state = evaluate_permission_dependencies(permission, granted_permissions)
        if state["granted"]:
            effective.append(permission)

    return sorted(set(effective))


def resolve_capabilities(granted_permissions: List[str]) -> Dict[str, PermissionRequirementState]:
    if "*" in granted_permissions:
        return {
            key: {
                "granted": True,
                "missingAllOf": [],
                "missingAnyOf": [],
            }
            for key in CAPABILITY_REQUIREMENTS
        }

    return {
        key: evaluate_permission_requirement(requirement, granted_permissions)
        for key, requirement in CAPABILITY_REQUIREMENTS.items()
    }


def build_permission_context(granted_permissions: List[str]):
    effective_permissions = project_effective_permissions(granted_permissions)
    capabilities = resolve_capabilities(granted_permissions)

    return {
        "effectivePermissions": effective_permissions,
        "capabilities": capabilities,
        "permissionDependenciesVersion": "v1",
        "strictCapabilityPrefixes": STRICT_CAPABILITY_PREFIXES,
    }
