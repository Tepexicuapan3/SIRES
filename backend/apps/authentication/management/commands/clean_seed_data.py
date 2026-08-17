from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import ProtectedError

from apps.authentication.models import SyUsuario
from apps.catalogos.models import Permisos, Roles
from apps.recepcion.models import Visit

# Usernames creados por seed_auth_access_base()/_demo()/_edge_cases()
# (domains/auth_access/infrastructure/bootstrap/auth_access_seeders.py).
AUTH_ACCESS_SEED_USERNAMES = (
    "admin",
    "user_base",
    "demo_support",
    "demo_auditor",
    "demo_manager",
    "edge_no_role",
    "edge_inactive_role_user",
)

# Usernames creados por seed_e2e.py (USER_DEFS).
E2E_SEED_USERNAMES = (
    "admin",
    "admin_usuarios",
    "admin_expedientes",
    "admin_roles",
    "admin_catalogos",
    "admin_reportes",
    "admin_estadisticas",
    "admin_autorizacion",
    "admin_licencias",
    "admin_conciliacion",
    "admin_lectura",
    "auditor_sistema",
    "clinico",
    "recepcion",
    "farmacia",
    "urgencias",
    "usuario_inactivo",
    "usuario_bloqueado",
    "usuario_onboarding",
    "usuario_cambiar_clave",
    "usuario_sin_centros",
    "usuario_onboarding_clinico",
    "usuario_onboarding_recepcion",
    "usuario_onboarding_farmacia",
    "usuario_onboarding_urgencias",
    "usuario_cambiar_clave_clinico",
    "usuario_cambiar_clave_admin",
    "usuario_inactivo_clinico",
    "usuario_inactivo_admin",
    "usuario_bloqueado_clinico",
    "usuario_bloqueado_admin",
    "usuario_multirol",
)

SEED_USERNAMES = sorted(set(AUTH_ACCESS_SEED_USERNAMES) | set(E2E_SEED_USERNAMES))

# Role codes de seed_e2e.py (ROLE_DEFS) + auth_access_seeders.py.
SEED_ROLE_CODES = (
    "admin",
    "user",
    "support",
    "auditor",
    "manager",
    "edge_role_without_permissions",
    "ADMIN",
    "ADMIN_USUARIOS",
    "ADMIN_EXPEDIENTES",
    "ADMIN_ROLES",
    "ADMIN_CATALOGOS",
    "ADMIN_REPORTES",
    "ADMIN_ESTADISTICAS",
    "ADMIN_AUTORIZACION",
    "ADMIN_LICENCIAS",
    "ADMIN_CONCILIACION",
    "ADMIN_SOLO_LECTURA",
    "SISTEMA_AUDITORIA",
    "ROL_INACTIVO_PRUEBA",
    "CLINICO",
    "RECEPCION",
    "FARMACIA",
    "URGENCIAS",
)

# Permission codes de seed_e2e.py (PERMISSIONS) + auth_access_seeders.py
# (BASE_PERMISSIONS + demo + edge-case).
SEED_PERMISSION_CODES = (
    "read_users",
    "write_users",
    "delete_users",
    "manage_roles",
    "read_audit",
    "read_profiles",
    "manage_password_resets",
    "edge_orphan_permission",
    "admin:gestion:usuarios:read",
    "admin:gestion:usuarios:create",
    "admin:gestion:usuarios:update",
    "admin:gestion:usuarios:delete",
    "admin:gestion:medicos:read",
    "admin:gestion:medicos:create",
    "admin:gestion:medicos:update",
    "admin:gestion:medicos:horarios",
    "admin:gestion:medicos:excepciones",
    "admin:gestion:medicos:coberturas",
    "admin:gestion:expedientes:read",
    "admin:gestion:roles:read",
    "admin:gestion:roles:create",
    "admin:gestion:roles:update",
    "admin:gestion:roles:delete",
    "admin:gestion:permisos:read",
    "admin:catalogos:centros_atencion:read",
    "admin:catalogos:centros_atencion:create",
    "admin:catalogos:centros_atencion:update",
    "admin:catalogos:centros_atencion:delete",
    "admin:catalogos:areas:read",
    "admin:catalogos:areas:create",
    "admin:catalogos:areas:update",
    "admin:catalogos:areas:delete",
    "admin:catalogos:vacunas:read",
    "admin:catalogos:vacunas:create",
    "admin:catalogos:vacunas:update",
    "admin:catalogos:vacunas:delete",
    "admin:catalogos:areas_clinicas:read",
    "admin:catalogos:areas_clinicas:create",
    "admin:catalogos:areas_clinicas:update",
    "admin:catalogos:areas_clinicas:delete",
    "admin:catalogos:centro_area_clinica:read",
    "admin:catalogos:centro_area_clinica:create",
    "admin:catalogos:centro_area_clinica:update",
    "admin:catalogos:centro_area_clinica:delete",
    "admin:catalogos:especialidades:read",
    "admin:catalogos:especialidades:create",
    "admin:catalogos:especialidades:update",
    "admin:catalogos:especialidades:delete",
    "admin:reportes:read",
    "admin:estadisticas:read",
    "admin:autorizacion:recetas:read",
    "admin:autorizacion:estudios:read",
    "admin:licencias:read",
    "admin:conciliacion:read",
    "clinico:consultas:read",
    "clinico:consultas:agenda:read",
    "clinico:consultas:create",
    "clinico:consultas:historial:read",
    "clinico:expedientes:read",
    "clinico:expedientes:create",
    "clinico:somatometria:read",
    "recepcion:fichas:medicina_general:read",
    "recepcion:fichas:medicina_general:create",
    "recepcion:fichas:especialidad:read",
    "recepcion:fichas:especialidad:create",
    "recepcion:fichas:urgencias:read",
    "recepcion:fichas:urgencias:create",
    "recepcion:incapacidad:create",
    "recepcion:citas:read",
    "recepcion:citas:write",
    "farmacia:recetas:dispensar",
    "farmacia:inventario:update",
    "farmacia:vacunas:read",
    "farmacia:vacunas:create",
    "farmacia:vacunas:update",
    "farmacia:vacunas:delete",
    "urgencias:triage:read",
)

# Folios de visitas demo de seed_e2e.py (DEMO_VISITS).
SEED_VISIT_FOLIOS = (
    "RCP-DEMO-0001",
    "RCP-DEMO-0002",
    "SMT-DEMO-0001",
    "SMT-DEMO-0002",
    "SMT-DEMO-0003",
    "SMT-DEMO-0004",
    "DOC-DEMO-0001",
    "DOC-DEMO-0002",
    "DOC-DEMO-0003",
)


class Command(BaseCommand):
    help = (
        "Borra SOLO los usuarios/roles/permisos/visitas creados por los "
        "seeders conocidos (seed_auth_access --base/--demo/--edge-cases y "
        "seed_e2e.py), identificados por username/codigo/folio exactos. "
        "No toca ningun otro registro. Por defecto corre en modo vista "
        "previa (no borra nada) -- pasa --confirm para ejecutar de verdad."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirm",
            action="store_true",
            help="Ejecuta el borrado de verdad. Sin esto, solo muestra que se borraria.",
        )
        parser.add_argument(
            "--keep-username",
            action="append",
            default=[],
            help=(
                "Username a excluir del borrado aunque este en la lista de seed "
                "(por ejemplo, si ya creaste tu admin real con el mismo nombre "
                "'admin' que usa el seed). Se puede repetir."
            ),
        )

    def handle(self, *args, **options):
        confirm = options["confirm"]
        keep_usernames = set(options["keep_username"])

        usernames_to_delete = [
            u for u in SEED_USERNAMES if u not in keep_usernames
        ]

        users_qs = SyUsuario.objects.filter(usuario__in=usernames_to_delete)
        roles_qs = Roles.objects.filter(rol__in=SEED_ROLE_CODES)
        permissions_qs = Permisos.objects.filter(codigo__in=SEED_PERMISSION_CODES)
        visits_qs = Visit.objects.filter(folio__in=SEED_VISIT_FOLIOS)

        found_usernames = sorted(users_qs.values_list("usuario", flat=True))
        found_roles = sorted(roles_qs.values_list("rol", flat=True))
        found_permissions = sorted(permissions_qs.values_list("codigo", flat=True))
        found_visits = sorted(visits_qs.values_list("folio", flat=True))

        skipped_usernames = sorted(
            u for u in SEED_USERNAMES if u in keep_usernames
        )

        self.stdout.write("=== Vista previa ===")
        self.stdout.write(f"Usuarios a borrar ({len(found_usernames)}): {found_usernames}")
        if skipped_usernames:
            self.stdout.write(
                f"Usuarios EXCLUIDOS por --keep-username ({len(skipped_usernames)}): {skipped_usernames}"
            )
        self.stdout.write(f"Roles a borrar ({len(found_roles)}): {found_roles}")
        self.stdout.write(f"Permisos a borrar ({len(found_permissions)}): {found_permissions}")
        self.stdout.write(f"Visitas demo a borrar ({len(found_visits)}): {found_visits}")

        if not confirm:
            self.stdout.write(
                self.style.WARNING(
                    "\nModo vista previa -- no se borro nada. Corre con --confirm para ejecutar."
                )
            )
            return

        try:
            with transaction.atomic():
                visits_qs.delete()
                users_qs.delete()
                roles_qs.delete()
                permissions_qs.delete()
        except ProtectedError as exc:
            protected_objects = list(exc.args[1]) if len(exc.args) > 1 else []
            self.stderr.write(
                self.style.ERROR(
                    "Borrado abortado (nada se toco, la transaccion se revirtio): "
                    f"{len(protected_objects)} registro(s) real(es) dependen de un "
                    "usuario/rol de la lista de seed (ej. consultas medicas ya "
                    "firmadas). Revisa esos registros antes de borrar ese usuario "
                    "puntual, o excluilo con --keep-username."
                )
            )
            for obj in protected_objects[:20]:
                self.stderr.write(f"  - {obj!r}")
            return

        self.stdout.write(
            self.style.SUCCESS(
                f"\nBorrado OK: {len(found_usernames)} usuario(s), {len(found_roles)} rol(es), "
                f"{len(found_permissions)} permiso(s), {len(found_visits)} visita(s) demo "
                "(mas sus filas relacionadas en cascada: perfiles, asignaciones de rol, etc.)."
            )
        )
