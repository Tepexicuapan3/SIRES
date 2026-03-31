# KAN-61 - Evidencia de extracción de casos de uso RBAC críticos

> TL;DR: KAN-61 extrae reglas críticas RBAC de mutaciones sensibles fuera de `rbac_views.py` hacia `use_cases` + `policies`, manteniendo rutas/contratos actuales y trazabilidad de auditoría.

## 1) Scope ejecutado

- Ticket: `KAN-61`
- Epic: `KAN-46`
- Dominio: `auth-access` (`hybrid`)
- Objetivo ejecutado: mover lógica crítica de mutaciones RBAC a capa `application` (use cases) con policy dedicada.

En alcance:

- `POST /api/v1/permissions/assign`
- `DELETE /api/v1/permissions/roles/{role_id}/permissions/{permission_id}`
- `POST /api/v1/users/{user_id}/roles`
- `PUT /api/v1/users/{user_id}/roles/primary`
- `DELETE /api/v1/users/{user_id}/roles/{role_id}`
- `POST /api/v1/users/{user_id}/overrides`
- `DELETE /api/v1/users/{user_id}/overrides/{code}`

Fuera de alcance:

- Cambio de contrato HTTP.
- Cambios de schema/migraciones DB.
- Corte big-bang de `rbac_views`.

## 2) Diseño aplicado

Nuevas piezas:

- `backend/apps/administracion/use_cases/rbac_write/*`
  - `assign_role_permissions.py`
  - `revoke_role_permission.py`
  - `assign_user_roles.py`
  - `set_user_primary_role.py`
  - `revoke_user_role.py`
  - `upsert_user_override.py`
  - `remove_user_override.py`
  - `exceptions.py`
- `backend/apps/administracion/policies/rbac_write_policy.py`
- `backend/apps/administracion/services/rbac_permission_rules.py`

Integración en transporte:

- `backend/apps/administracion/views/rbac_views.py` quedó como adaptador HTTP (auth/csrf, request parsing, respuesta estándar, auditoría) delegando comportamiento crítico a use cases.

## 3) Compatibilidad y contratos

- Rutas públicas: sin cambios.
- Shape de respuesta/error: sin cambios (`error_response`).
- Auditoría: acciones y campos mínimos conservados (`requestId`, actor/target, before/after cuando aplica).
- Revisiones de auth revision (`touch_user_auth_revision`, `touch_users_auth_revision`): preservadas.

## 4) Evidencia TDD-first (Red -> Green -> Refactor) — verificable

Riesgo declarado para KAN-61: **P1** (`tdd-risk-strategy-kan-55.md`, sección 5).

### RED (falla inicial real)

- Objetivo: demostrar que faltaba trazabilidad de revisión de auth al setear rol primario en el nuevo use case.
- Test-first agregado (unit/service):
  - `apps.administracion.tests.test_rbac_services_and_utils.SetUserPrimaryRoleUseCaseTests.test_updates_primary_role_and_touches_auth_revision`
- Comando:

```bash
python manage.py test apps.administracion.tests.test_rbac_services_and_utils.SetUserPrimaryRoleUseCaseTests.test_updates_primary_role_and_touches_auth_revision -v 2
```

- Resultado RED (extracto):
  - `FAILED (errors=1)`
  - `AttributeError: ... set_user_primary_role ... does not have the attribute 'touch_user_auth_revision'`
- Run ref local: `KAN-61-RED-2026-03-30-01`.

### GREEN (cambio mínimo + run en verde)

- Implementación mínima aplicada:
  - `backend/apps/administracion/use_cases/rbac_write/set_user_primary_role.py`
    - integración explícita con `touch_user_auth_revision(user, actor_id=...)`.
- Comando:

```bash
python manage.py test apps.administracion.tests.test_rbac_services_and_utils.SetUserPrimaryRoleUseCaseTests.test_updates_primary_role_and_touches_auth_revision -v 2
```

- Resultado GREEN (extracto):
  - `Ran 1 test ... OK`
  - `test_updates_primary_role_and_touches_auth_revision ... ok`
- Run ref local: `KAN-61-GREEN-2026-03-30-01`.

### REFACTOR (sin cambio de comportamiento + no-regresión)

- Refactor aplicado (comportamiento preservado):
  - `set_user_primary_role.py` ahora refresca `fch_modf/usr_modf` desde DB tras `touch_user_auth_revision`, evitando doble update manual.
- Verificación de no-regresión ejecutando **unit/service + integration/API**:

```bash
python manage.py test apps.administracion.tests.test_rbac_services_and_utils.SetUserPrimaryRoleUseCaseTests apps.administracion.tests.test_rbac_users_api.RbacUsersApiTests.test_assign_roles_and_set_primary -v 2
```

- Resultado REFACTOR (extracto):
  - `Ran 2 tests ... OK`
  - `SetUserPrimaryRoleUseCaseTests ... ok`
  - `RbacUsersApiTests.test_assign_roles_and_set_primary ... ok`
- Run ref local: `KAN-61-REFACTOR-2026-03-30-01`.

### Coverage vs Risk Gate (P1)

- Risk level: `P1`
- Unit/service: `ok`
- Integration/API: `ok`
- E2E crítico: `n/a` (no aplica por matriz P1, salvo umbral sección 8 de KAN-55)
- Resultado gate: **GO**

## 5) Docker-first (estado final) y excepción TDD

Estado final de validación (2026-03-30):

```bash
docker compose up -d auth-db redis backend
docker compose exec -T backend python manage.py test apps.administracion.tests.test_rbac_services_and_utils.SetUserPrimaryRoleUseCaseTests apps.administracion.tests.test_rbac_users_api.RbacUsersApiTests.test_assign_roles_and_set_primary -v 2
```

Resultado Docker-first:

- Servicios `auth-db`, `redis`, `backend` en `Running/Healthy`.
- Test run en contenedor backend:
  - `Ran 2 tests in 2.490s`
  - `OK`

Decisión de compliance (KAN-55):

- El `TddExceptionRecord` preliminar queda **sin efecto / cerrado por remediación**, porque el bloqueo de Docker dejó de aplicar y la validación exigida se ejecutó en entorno containerizado.
- Consecuencia: `approval_ref` ya no es requerido para KAN-61 en estado final (no hay excepción activa).

## 6) Riesgos residuales y mitigación

- Riesgo: divergencia futura entre policy/use case y helpers legacy.
  - Mitigación: continuar extracción incremental de funciones auxiliares legacy a módulos application/domain en siguientes slices.
- Riesgo: drift futuro entre evidencia en PR/Jira y estado real del ticket.
  - Mitigación: mantener Jira + PR como fuente de verdad y enlazar explícitamente cada actualización de evidencia de cierre.

## 7) Referencias

- `docs/domains/auth-access/rbac-views-extraction-slices-plan.md`
- `docs/domains/auth-access/tdd-risk-strategy-kan-55.md`
- `docs/domains/auth-access/tdd-evidence-templates.md`
- `docs/guides/pr-merge-governance.md`
