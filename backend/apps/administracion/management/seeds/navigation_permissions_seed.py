"""
Alta de los permisos de `catalogos.Permisos` que `navigation_seed.py`
referencia pero que la auditoría del change `menu-modulos` (engram
`sdd/menu-modulos/orphan-permissions-audit`) confirmó como categoría A:
feature real (backend + frontend existen), solo faltaba el código en
`cat_permisos`.

Los 14 códigos categoría B (placeholders / componentes mock sin backend
real) NO se agregan acá — se eliminaron directamente de `navigation_seed.py`
(ver `NAV_SEED`), así que nunca deben tener permiso ni módulo asociado.

Cada entrada es (codigo, descripcion). `seed_navigation_menu` sigue sin
crear permisos (por diseño, ver comentario en el comando): este seed es el
paso previo que hay que correr antes para que esos 17 códigos dejen de
reportarse como huérfanos.

Los 4 códigos `admin:gestion:modulos:{read,create,update,delete}` (change
`menu-modulos-crud-ui`, tarea 3.1) NO vienen de esa auditoría: protegen la
pantalla nueva `/admin/menus` (CRUD de `Modulo`). Se dan de alta acá para
reusar el mismo comando idempotente `seed_navigation_permissions`.
"""

NAVIGATION_PERMISSIONS_SEED: list[tuple[str, str]] = [
    ("admin:catalogos:areas:read", "Ver catalogo de areas"),
    ("admin:catalogos:areas_clinicas:read", "Ver catalogo de areas clinicas"),
    (
        "admin:catalogos:centro_area_clinica:read",
        "Ver areas clinicas por centro de atencion",
    ),
    (
        "admin:catalogos:centros_atencion:read",
        "Ver catalogo de centros de atencion",
    ),
    ("admin:catalogos:especialidades:read", "Ver catalogo de especialidades"),
    ("admin:catalogos:vacunas:read", "Ver catalogo administrativo de vacunas"),
    ("admin:gestion:expedientes:read", "Ver expedientes clinicos"),
    ("admin:gestion:medicos:read", "Ver catalogo de medicos"),
    ("admin:gestion:modulos:read", "Ver modulos del menu de navegacion"),
    ("admin:gestion:modulos:create", "Crear modulos del menu de navegacion"),
    ("admin:gestion:modulos:update", "Editar modulos del menu de navegacion"),
    ("admin:gestion:modulos:delete", "Eliminar modulos del menu de navegacion"),
    ("admin:gestion:roles:read", "Ver roles del sistema"),
    ("admin:gestion:usuarios:read", "Ver usuarios del sistema"),
    ("admin:usuarios:sesiones:read", "Ver sesiones activas de usuarios"),
    ("clinico:consultas:read", "Ver consultas medicas"),
    ("clinico:somatometria:read", "Ver somatometria"),
    ("farmacia:vacunas:read", "Ver inventario operativo de vacunas"),
    (
        "recepcion:fichas:medicina_general:create",
        "Registrar ficha de medicina general",
    ),
    ("recepcion:fichas:especialidad:create", "Registrar ficha de especialidad"),
    ("recepcion:fichas:urgencias:create", "Registrar ficha de urgencias"),
]

# Segunda tanda (2026-08-23, fuera de la auditoria original): catalogos que
# se agregaron a `navigation_seed.py` DESPUES del audit engram y nunca
# recibieron su codigo en `cat_permisos`. Confirmados uno por uno contra
# `requiredPermission` en `admin.routes.config.tsx` / `servicios.routes.config.tsx`
# -- todos protegen una pantalla real ya montada en el router, no son
# placeholders. Sin estos codigos, esos modulos quedaban "publicos" en el
# menu (visibles para cualquier autenticado) por la regla de
# `GetNavigationMenuUseCase`: sin permiso asociado = publico.
NAVIGATION_PERMISSIONS_SEED += [
    ("admin:catalogos:autorizadores:read", "Ver catalogo de autorizadores"),
    ("admin:catalogos:bajas:read", "Ver catalogo de bajas"),
    ("admin:catalogos:calidad_laboral:read", "Ver catalogo de calidad laboral"),
    ("admin:catalogos:cies:upload", "Cargar catalogo CIE-S"),
    ("admin:catalogos:edo_civil:read", "Ver catalogo de estado civil"),
    ("admin:catalogos:enfermedades:read", "Ver catalogo de enfermedades"),
    ("admin:catalogos:escolaridad:read", "Ver catalogo de escolaridad"),
    ("admin:catalogos:escuelas:read", "Ver catalogo de escuelas"),
    ("admin:catalogos:estudios_med:read", "Ver catalogo de estudios medicos"),
    (
        "admin:catalogos:grupos_medicamentos:read",
        "Ver catalogo de grupos de medicamentos",
    ),
    ("admin:catalogos:licencias:read", "Ver catalogo de licencias"),
    ("admin:catalogos:ocupaciones:read", "Ver catalogo de ocupaciones"),
    ("admin:catalogos:origen_cons:read", "Ver catalogo de origen de consulta"),
    ("admin:catalogos:parentescos:read", "Ver catalogo de parentescos"),
    ("admin:catalogos:pases:read", "Ver catalogo de pases"),
    ("admin:catalogos:sucursales:read", "Ver catalogo de sucursales"),
    ("admin:catalogos:tipo_citas:read", "Ver catalogo de tipos de citas"),
    ("admin:catalogos:tipo_personal:read", "Ver catalogo de tipos de personal"),
    ("admin:catalogos:tipos_areas:read", "Ver catalogo de tipos de areas"),
    ("admin:catalogos:tipos_sanguineo:read", "Ver catalogo de tipos sanguineos"),
    (
        "admin:catalogos:tp_autorizacion:read",
        "Ver catalogo de tipos de autorizacion",
    ),
    ("admin:catalogos:turnos:read", "Ver catalogo de turnos"),
    ("almacen:inventario:read", "Ver inventario de almacen"),
    ("servicios:contratos_oxigeno:read", "Ver contratos de oxigeno"),
]
