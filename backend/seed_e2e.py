from django.contrib.auth.hashers import make_password
from django.db import transaction

from apps.administracion.models import RelRolPermiso, RelUsuarioRol
from apps.authentication.models import DetUsuario, SyUsuario
from apps.catalogos.models import CatCentroAtencion, CatPermiso, CatRol

DEFAULT_PASSWORD = "Sires_123456"

PERMISSIONS = [
    ("admin:gestion:usuarios:read", "Admin - Ver usuarios y perfiles"),
    ("admin:gestion:expedientes:read", "Admin - Ver expedientes"),
    ("admin:gestion:roles:read", "Admin - Ver roles"),
    ("admin:catalogos:centros_atencion:read", "Admin - Ver centros de atencion"),
    ("admin:catalogos:areas:read", "Admin - Ver areas"),
    ("admin:reportes:read", "Admin - Ver reportes"),
    ("admin:estadisticas:read", "Admin - Ver estadisticas"),
    ("admin:autorizacion:recetas:read", "Admin - Autorizacion recetas"),
    ("admin:autorizacion:estudios:read", "Admin - Autorizacion estudios"),
    ("admin:licencias:read", "Admin - Licencias"),
    ("admin:conciliacion:read", "Admin - Conciliacion"),
    ("clinico:consultas:read", "Clinico - Ver consultas"),
    ("clinico:consultas:agenda:read", "Clinico - Ver agenda"),
    ("clinico:consultas:create", "Clinico - Crear consulta"),
    ("clinico:consultas:historial:read", "Clinico - Ver historial"),
    ("clinico:expedientes:read", "Clinico - Ver expedientes"),
    ("clinico:expedientes:create", "Clinico - Crear expediente"),
    ("clinico:somatometria:read", "Clinico - Ver somatometria"),
    ("recepcion:fichas:medicina_general:create", "Recepcion - Ficha medicina general"),
    ("recepcion:fichas:especialidad:create", "Recepcion - Ficha especialidad"),
    ("recepcion:fichas:urgencias:create", "Recepcion - Ficha urgencias"),
    ("recepcion:incapacidad:create", "Recepcion - Incapacidad"),
    ("farmacia:recetas:dispensar", "Farmacia - Dispensar recetas"),
    ("farmacia:inventario:update", "Farmacia - Actualizar inventario"),
    ("urgencias:triage:read", "Urgencias - Ver triage"),
]

ROLE_DEFS = [
    {
        "code": "ADMIN",
        "desc": "Administrador",
        "landing": "/admin/roles",
        "is_admin": True,
        "perms": [],
    },
    {
        "code": "ADMIN_USUARIOS",
        "desc": "Admin Usuarios",
        "landing": "/admin/usuarios",
        "perms": ["admin:gestion:usuarios:read"],
    },
    {
        "code": "ADMIN_EXPEDIENTES",
        "desc": "Admin Expedientes",
        "landing": "/admin/expedientes",
        "perms": ["admin:gestion:expedientes:read"],
    },
    {
        "code": "ADMIN_ROLES",
        "desc": "Admin Roles",
        "landing": "/admin/roles",
        "perms": ["admin:gestion:roles:read"],
    },
    {
        "code": "ADMIN_CATALOGOS",
        "desc": "Admin Catalogos",
        "landing": "/admin/catalogos",
        "perms": [
            "admin:catalogos:centros_atencion:read",
            "admin:catalogos:areas:read",
        ],
    },
    {
        "code": "ADMIN_REPORTES",
        "desc": "Admin Reportes",
        "landing": "/admin/reportes",
        "perms": ["admin:reportes:read"],
    },
    {
        "code": "ADMIN_ESTADISTICAS",
        "desc": "Admin Estadisticas",
        "landing": "/admin/estadisticas",
        "perms": ["admin:estadisticas:read"],
    },
    {
        "code": "ADMIN_AUTORIZACION",
        "desc": "Admin Autorizacion",
        "landing": "/admin/autorizacion/recetas",
        "perms": [
            "admin:autorizacion:recetas:read",
            "admin:autorizacion:estudios:read",
        ],
    },
    {
        "code": "ADMIN_LICENCIAS",
        "desc": "Admin Licencias",
        "landing": "/admin/licencias",
        "perms": ["admin:licencias:read"],
    },
    {
        "code": "ADMIN_CONCILIACION",
        "desc": "Admin Conciliacion",
        "landing": "/admin/conciliacion",
        "perms": ["admin:conciliacion:read"],
    },
    {
        "code": "CLINICO",
        "desc": "Clinico",
        "landing": "/clinico/consultas",
        "perms": [
            "clinico:consultas:read",
            "clinico:consultas:agenda:read",
            "clinico:consultas:create",
            "clinico:consultas:historial:read",
            "clinico:expedientes:read",
            "clinico:expedientes:create",
            "clinico:somatometria:read",
        ],
    },
    {
        "code": "RECEPCION",
        "desc": "Recepcion",
        "landing": "/recepcion/fichas/medicina-general",
        "perms": [
            "recepcion:fichas:medicina_general:create",
            "recepcion:fichas:especialidad:create",
            "recepcion:fichas:urgencias:create",
            "recepcion:incapacidad:create",
        ],
    },
    {
        "code": "FARMACIA",
        "desc": "Farmacia",
        "landing": "/farmacia/recetas",
        "perms": [
            "farmacia:recetas:dispensar",
            "farmacia:inventario:update",
        ],
    },
    {
        "code": "URGENCIAS",
        "desc": "Urgencias",
        "landing": "/urgencias/triage",
        "perms": ["urgencias:triage:read"],
    },
]

USER_DEFS = [
    {"username": "admin", "email": "admin@sires.local", "full_name": "Admin Sistema", "role": "ADMIN"},
    {"username": "admin_usuarios", "email": "admin.usuarios@sires.local", "full_name": "Admin Usuarios", "role": "ADMIN_USUARIOS"},
    {"username": "admin_expedientes", "email": "admin.expedientes@sires.local", "full_name": "Admin Expedientes", "role": "ADMIN_EXPEDIENTES"},
    {"username": "admin_roles", "email": "admin.roles@sires.local", "full_name": "Admin Roles", "role": "ADMIN_ROLES"},
    {"username": "admin_catalogos", "email": "admin.catalogos@sires.local", "full_name": "Admin Catalogos", "role": "ADMIN_CATALOGOS"},
    {"username": "admin_reportes", "email": "admin.reportes@sires.local", "full_name": "Admin Reportes", "role": "ADMIN_REPORTES"},
    {"username": "admin_estadisticas", "email": "admin.estadisticas@sires.local", "full_name": "Admin Estadisticas", "role": "ADMIN_ESTADISTICAS"},
    {"username": "admin_autorizacion", "email": "admin.autorizacion@sires.local", "full_name": "Admin Autorizacion", "role": "ADMIN_AUTORIZACION"},
    {"username": "admin_licencias", "email": "admin.licencias@sires.local", "full_name": "Admin Licencias", "role": "ADMIN_LICENCIAS"},
    {"username": "admin_conciliacion", "email": "admin.conciliacion@sires.local", "full_name": "Admin Conciliacion", "role": "ADMIN_CONCILIACION"},
    {"username": "clinico", "email": "clinico@sires.local", "full_name": "Clinico Demo", "role": "CLINICO"},
    {"username": "recepcion", "email": "recepcion@sires.local", "full_name": "Recepcion Demo", "role": "RECEPCION"},
    {"username": "farmacia", "email": "farmacia@sires.local", "full_name": "Farmacia Demo", "role": "FARMACIA"},
    {"username": "urgencias", "email": "urgencias@sires.local", "full_name": "Urgencias Demo", "role": "URGENCIAS"},
    {
        "username": "usuario_inactivo",
        "email": "inactivo@sires.local",
        "full_name": "Usuario Inactivo",
        "role": "CLINICO",
        "is_active": False,
    },
    {
        "username": "usuario_bloqueado",
        "email": "bloqueado@sires.local",
        "full_name": "Usuario Bloqueado",
        "role": "RECEPCION",
        "is_blocked": True,
    },
    {
        "username": "usuario_onboarding",
        "email": "onboarding@sires.local",
        "full_name": "Usuario Onboarding",
        "role": "FARMACIA",
        "requires_onboarding": True,
    },
    {
        "username": "usuario_cambiar_clave",
        "email": "cambiar@sires.local",
        "full_name": "Usuario Cambiar Clave",
        "role": "URGENCIAS",
        "must_change_password": True,
    },
    {
        "username": "usuario_sin_centros",
        "email": "sincentro@sires.local",
        "full_name": "Usuario Sin Centro",
        "role": "ADMIN_ROLES",
        "center": None,
    },
    {
        "username": "usuario_onboarding_clinico",
        "email": "onboarding.clinico@sires.local",
        "full_name": "Onboarding Clinico",
        "role": "CLINICO",
        "requires_onboarding": True,
    },
    {
        "username": "usuario_onboarding_recepcion",
        "email": "onboarding.recepcion@sires.local",
        "full_name": "Onboarding Recepcion",
        "role": "RECEPCION",
        "requires_onboarding": True,
    },
    {
        "username": "usuario_onboarding_farmacia",
        "email": "onboarding.farmacia@sires.local",
        "full_name": "Onboarding Farmacia",
        "role": "FARMACIA",
        "requires_onboarding": True,
    },
    {
        "username": "usuario_onboarding_urgencias",
        "email": "onboarding.urgencias@sires.local",
        "full_name": "Onboarding Urgencias",
        "role": "URGENCIAS",
        "requires_onboarding": True,
    },
    {
        "username": "usuario_cambiar_clave_clinico",
        "email": "changepass.clinico@sires.local",
        "full_name": "Cambiar Clave Clinico",
        "role": "CLINICO",
        "must_change_password": True,
    },
    {
        "username": "usuario_cambiar_clave_admin",
        "email": "changepass.admin@sires.local",
        "full_name": "Cambiar Clave Admin",
        "role": "ADMIN_REPORTES",
        "must_change_password": True,
    },
    {
        "username": "usuario_inactivo_clinico",
        "email": "inactivo.clinico@sires.local",
        "full_name": "Clinico Inactivo",
        "role": "CLINICO",
        "is_active": False,
    },
    {
        "username": "usuario_inactivo_admin",
        "email": "inactivo.admin@sires.local",
        "full_name": "Admin Inactivo",
        "role": "ADMIN_CATALOGOS",
        "is_active": False,
    },
    {
        "username": "usuario_bloqueado_clinico",
        "email": "bloqueado.clinico@sires.local",
        "full_name": "Clinico Bloqueado",
        "role": "CLINICO",
        "is_blocked": True,
    },
    {
        "username": "usuario_bloqueado_admin",
        "email": "bloqueado.admin@sires.local",
        "full_name": "Admin Bloqueado",
        "role": "ADMIN_ESTADISTICAS",
        "is_blocked": True,
    },
    {
        "username": "usuario_multirol",
        "email": "multirol@sires.local",
        "full_name": "Usuario Multirol",
        "role": "CLINICO",
        "extra_roles": ["RECEPCION", "FARMACIA"],
    },
]


def _get_or_create_user(username, email, full_name, center, admin_user=None, **flags):
    """Crea o actualiza usuario de prueba asegurando flags correctos."""
    user, created = SyUsuario.objects.get_or_create(
        usuario=username,
        defaults={
            "correo": email,
            "clave_hash": make_password(DEFAULT_PASSWORD),
            "terminos_acept": True,
            "cambiar_clave": False,
            "est_activo": True,
            "est_bloqueado": False,
            "usr_alta": admin_user,
        },
    )

    updated_fields = []
    
    # Siempre actualizar correo
    if user.correo != email:
        user.correo = email
        updated_fields.append("correo")
    
    # Siempre actualizar password para asegurar
    user.clave_hash = make_password(DEFAULT_PASSWORD)
    updated_fields.append("clave_hash")

    # Flags de estado
    est_activo = flags.get("is_active", True)
    if user.est_activo != est_activo:
        user.est_activo = est_activo
        updated_fields.append("est_activo")

    est_bloqueado = flags.get("is_blocked", False)
    if user.est_bloqueado != est_bloqueado:
        user.est_bloqueado = est_bloqueado
        updated_fields.append("est_bloqueado")

    # Flags de onboarding - CRÍTICO para tests E2E
    must_change = flags.get("must_change_password", False)
    if user.cambiar_clave != must_change:
        user.cambiar_clave = must_change
        updated_fields.append("cambiar_clave")

    requires_onboarding = flags.get("requires_onboarding", False)
    if requires_onboarding:
        # Para onboarding, términos NO deben estar aceptados
        if user.terminos_acept:
            user.terminos_acept = False
            updated_fields.append("terminos_acept")
    else:
        # Usuario normal: términos aceptados y no requiere cambio
        if not user.terminos_acept and not must_change:
            user.terminos_acept = True
            updated_fields.append("terminos_acept")

    if flags.get("center") is not None:
        assigned_center = flags["center"]
    else:
        assigned_center = center

    # Guardar si hay cambios
    if updated_fields:
        user.save(update_fields=list(set(updated_fields)))
        print(f"[SEED] Actualizado {username}: {', '.join(set(updated_fields))}")
    else:
        print(f"[SEED] Verificado {username}: OK")

    # Actualizar detalles de usuario
    DetUsuario.objects.update_or_create(
        id_usuario=user,
        defaults={
            "nombre": full_name.split(" ")[0],
            "paterno": full_name.split(" ")[1] if len(full_name.split(" ")) > 1 else "Demo",
            "materno": "",
            "nombre_completo": full_name,
            "id_centro_atencion": assigned_center,
        },
    )

    return user


@transaction.atomic
def run():
    center, _ = CatCentroAtencion.objects.get_or_create(
        folio="CA-001",
        defaults={
            "nombre": "Centro de Atencion Local",
            "direccion": "Av. Demo 123, CDMX",
            "horario": {
                "lunes": "08:00-16:00",
                "martes": "08:00-16:00",
                "miercoles": "08:00-16:00",
                "jueves": "08:00-16:00",
                "viernes": "08:00-16:00",
            },
        },
    )

    admin_user = _get_or_create_user(
        "admin",
        "admin@sires.local",
        "Admin Sistema",
        center,
        admin_user=None,
    )

    perms_map = {}
    for code, desc in PERMISSIONS:
        perm, _ = CatPermiso.objects.update_or_create(
            codigo=code,
            defaults={
                "descripcion": desc,
                "est_activo": True,
                "es_sistema": False,
                "usr_alta": admin_user,
            },
        )
        perms_map[code] = perm

    role_map = {}
    for role_def in ROLE_DEFS:
        role, _ = CatRol.objects.update_or_create(
            rol=role_def["code"],
            defaults={
                "desc_rol": role_def["desc"],
                "landing_route": role_def["landing"],
                "is_admin": role_def.get("is_admin", False),
                "es_sistema": False,
                "est_activo": True,
                "usr_alta": admin_user,
            },
        )

        role_map[role_def["code"]] = role

        if role_def.get("is_admin"):
            continue

        for code in role_def["perms"]:
            perm = perms_map.get(code)
            if not perm:
                continue
            RelRolPermiso.objects.get_or_create(
                id_rol=role,
                id_permiso=perm,
                defaults={"usr_asignacion": admin_user},
            )

    for user_def in USER_DEFS:
        extra_flags = {k: v for k, v in user_def.items() if k not in {"username", "email", "full_name", "role"}}
        custom_center = extra_flags.pop("center", None)

        user = _get_or_create_user(
            user_def["username"],
            user_def["email"],
            user_def["full_name"],
            custom_center or center,
            admin_user=admin_user,
            **extra_flags,
        )

        role = role_map.get(user_def["role"])
        if role:
            RelUsuarioRol.objects.get_or_create(
                id_usuario=user,
                id_rol=role,
                defaults={"is_primary": True, "usr_asignacion": admin_user},
            )

        extra_roles = user_def.get("extra_roles") or []
        for role_code in extra_roles:
            extra_role = role_map.get(role_code)
            if not extra_role:
                continue
            RelUsuarioRol.objects.get_or_create(
                id_usuario=user,
                id_rol=extra_role,
                defaults={"is_primary": False, "usr_asignacion": admin_user},
            )


if __name__ == "__main__":
    run()
