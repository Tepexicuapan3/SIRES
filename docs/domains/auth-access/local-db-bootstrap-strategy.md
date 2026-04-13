# Auth-Access - Local DB Bootstrap & Seed Strategy

> TL;DR: este playbook deja un flujo reproducible de DB local para auth-access usando Docker, migraciones versionadas y seeders idempotentes (`base`, `demo`, `edge-cases`, `factory`).

## Contexto

El dominio Auth-Access necesita que cualquier dev levante entorno local sin pasos manuales ni dependencia de otro miembro del equipo.

La estrategia mantiene el baseline actual de SISEM:

- PostgreSQL compartido en etapa actual (aislamiento lógico por dominio).
- Migración incremental domain-first (sin big-bang).
- Seguridad y trazabilidad obligatorias (JWT HttpOnly + CSRF + auditoría).

## Estado actual de datos Auth-Access (análisis)

## Entidades in-scope del dominio

| Entidad lógica auth-access | Tabla actual | Ubicación actual |
| --- | --- | --- |
| Users | `sy_usuarios` | `apps.authentication` |
| User profile | `det_usuarios` | `apps.authentication` |
| Roles | `cat_roles` | `apps.catalogos` |
| Permissions | `cat_permisos` | `apps.catalogos` |
| User-Role | `rel_usuario_roles` | `apps.administracion` |
| Role-Permission | `rel_rol_permisos` | `apps.administracion` |
| User overrides | `rel_usuario_overrides` | `apps.administracion` |
| Audit (auth/rbac) | `auditoria_eventos` | `apps.administracion` |

## Datos fuera de alcance (pero referenciados)

| Dato | Tabla | Motivo de fuera de alcance |
| --- | --- | --- |
| Centros de atención | `cat_centros_atencion` | Es catálogo transversal de operación clínica/administrativa, no core de auth-access |

## Faltantes para completar ownership auth-access

1. Ownership de roles/permisos sigue distribuido en `catalogos` y no en módulo owner de auth-access.
2. Tablas pivote y auditoría auth/rbac siguen en `administracion` (ownership mixto legacy).
3. No hay separación física por dominio (esperado en etapa actual, pendiente por criterios).
4. No existe tabla de sesión persistente porque arquitectura actual es JWT cookie stateless (válido por diseño actual).

## Estrategia implementada

## 1) Migraciones (estructura)

Las migraciones versionadas actuales cubren entidades de auth-access:

- `apps/authentication/migrations/*` (users/profile)
- `apps/catalogos/migrations/0001_initial.py` (roles/permissions)
- `apps/administracion/migrations/0001_initial.py` (user_roles/role_permissions/overrides/audit)

Se ejecutan en orden vía `python manage.py migrate`.

## 2) Seeders obligatorios

Comando: `python manage.py seed_auth_access --base`

Inserta/actualiza de forma idempotente:

- Roles base: `admin`, `user`
- Permisos base: `read_users`, `write_users`, `delete_users`, `manage_roles`
- Usuario admin por defecto:
  - `admin@example.com`
  - password desde `AUTH_ACCESS_ADMIN_PASSWORD` (o `--admin-password`)
- Asigna todos los permisos base al rol `admin`
- Asocia usuario admin al rol `admin`

## 3) Seeders por escenario

Comandos independientes:

- Demo: `python manage.py seed_auth_access --demo`
- Edge cases: `python manage.py seed_auth_access --edge-cases`

Escenarios incluidos:

- Demo: múltiples usuarios y roles con combinaciones de permisos.
- Edge cases:
  - usuario sin roles,
  - rol sin permisos,
  - permiso no asignado a ningún rol (huérfano lógico).

## 4) Factories / generación de volumen

Comando:

```bash
python manage.py seed_auth_access --factory-users 50
```

Genera usuarios reproducibles (`factory_user_001...`) con:

- asignación aleatoria de roles,
- distribución de permisos por rol,
- overrides aleatorios controlados.

## 5) Setup único y reset reproducible

Se agregó `Makefile` en raíz con targets:

- `make setup` -> Docker up + migrate + seed base
- `make setup-auth-demo` -> setup + demo
- `make setup-auth-full` -> setup + demo + edge + factories
- `make reset-db` -> recrea DB + seed base
- `make reset-db-demo`
- `make reset-db-full`

Además, `backend/start-docker.sh` ahora permite bootstrap base automático al arrancar backend con:

- `RUN_SEED_ON_BOOT=true` (default)

## Guía rápida para dev

## Levantar desde cero

```bash
make setup
```

## Levantar con datos de demo y edge

```bash
make setup-auth-full AUTH_FACTORY_USERS=100
```

## Reiniciar base de datos local

```bash
make reset-db
```

## Ejecutar seeders puntuales

```bash
make seed-auth-base
make seed-auth-demo
make seed-auth-edge
make seed-auth-factory AUTH_FACTORY_USERS=75
```

## Reglas de separación (reutilizable para otros dominios)

Patrón replicable para cualquier dominio `X`:

1. `migrations` -> estructura
2. `seeders` -> datos mínimos obligatorios
3. `scenario seeders` -> casos funcionales de prueba
4. `factories` -> volumen/estrés local
5. `setup/reset` -> comandos one-shot reproducibles

En Auth-Access, la implementación vive en:

- `backend/domains/auth_access/infrastructure/bootstrap/`
- `backend/apps/authentication/management/commands/`

## Próxima fase recomendada (ownership real por dominio)

1. Consolidar ownership de `roles`, `permissions`, pivotes y audit de auth/rbac bajo módulo owner de auth-access.
2. Mantener wrappers de compatibilidad durante transición (`legacy -> hybrid -> domain-first`).
3. Separar explícitamente catálogos no auth (ej. centros) en dominio administrativo/catálogos y consumir por contrato.
4. Evaluar separación física de DB por dominio sólo con criterios de SLO/compliance/carga.

## Referencias

- `docs/architecture/db-ownership-migration-policy.md`
- `docs/guides/incremental-domain-migration.md`
- `docs/domains/auth-access/rbac-db-ownership-migration-strategy.md`
- `backend/apps/authentication/management/commands/seed_auth_access.py`
- `backend/apps/authentication/management/commands/setup_auth_access_local.py`
