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
