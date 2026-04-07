# KAN-66 - Evidencia de hardening de concurrencia e idempotencia RBAC write

> TL;DR: KAN-66 endurece hotspots de escritura RBAC en `auth-access` con locking pesimista (`select_for_update`) y recuperación de race por `IntegrityError`, preservando contratos HTTP/auditoría y validando idempotencia por replay en API.

## 1) Scope ejecutado

- Ticket: `KAN-66`
- Dominio: `auth-access` (`hybrid`)
- Objetivo: reducir riesgo de write races/duplicados en mutaciones críticas RBAC sin breaking changes.

Hotspots incluidos:

- `POST /api/v1/users/{user_id}/roles`
- `PUT /api/v1/users/{user_id}/roles/primary`
- `DELETE /api/v1/users/{user_id}/roles/{role_id}`
- `POST /api/v1/users/{user_id}/overrides`

Fuera de alcance:

- Cambios de contrato HTTP (rutas, payloads, status codes).
- Cambios de schema/migraciones.
- Refactors no vinculados a concurrencia/idempotencia.

## 2) Estrategia por hotspot

- `assign_user_roles.py`: lock de usuario + relaciones, deduplicación de `roleIds` del request y fallback de recuperación cuando el `create` colisiona por unique constraint.
- `set_user_primary_role.py`: lock del set activo de roles y transición determinística a único primario sin updates innecesarios.
- `revoke_user_role.py`: lock del set activo antes de validar último rol y antes de promocionar reemplazo.
- `upsert_user_override.py`: lock de lectura/escritura y recuperación ante `IntegrityError` en inserción concurrente.

## 3) Evidencia TDD-first (Red -> Green -> Refactor)

### RED

- Se ejecutó primero la suite objetivo KAN-66 en Docker y falló en dos casos de prueba de hardening:
  - `RbacWriteConcurrencyHardeningUseCaseTests.test_assign_user_roles_recovers_from_integrity_error`
  - `RbacWriteConcurrencyHardeningUseCaseTests.test_revoke_user_role_uses_select_for_update`
- Comando ejecutado:

```bash
docker compose exec -T backend python manage.py test apps.administracion.tests.test_rbac_services_and_utils.RbacWriteConcurrencyHardeningUseCaseTests apps.administracion.tests.test_rbac_users_api.RbacUsersApiTests.test_assign_roles_is_idempotent_on_replay apps.administracion.tests.test_rbac_users_api.RbacUsersApiTests.test_assign_roles_deduplicates_role_ids_in_single_request apps.administracion.tests.test_rbac_users_api.RbacUsersApiTests.test_set_primary_role_is_idempotent_on_replay apps.administracion.tests.test_rbac_users_api.RbacUsersApiTests.test_override_upsert_is_idempotent_on_replay -v 2
```

### GREEN

- Ajustes mínimos aplicados en tests de concurrencia para reflejar correctamente semántica idempotente y precondiciones de revoke.
- Se añadieron pruebas API faltantes de idempotencia por replay y deduplicación de payload duplicado.
- Mismos comandos re-ejecutados en Docker con resultado:
  - `Ran 8 tests ... OK`.

### REFACTOR

- Se ejecutó regresión ampliada de los módulos tocados para confirmar no-regresión del scope RBAC:

```bash
docker compose exec -T backend python manage.py test apps.administracion.tests.test_rbac_services_and_utils apps.administracion.tests.test_rbac_users_api -v 2
```

- Resultado: `Ran 95 tests` con `1` fallo fuera de alcance KAN-66 (`test_create_user_email_failure_rolls_back_creation`).

## 4) Validación Docker-first ejecutada

Precondición de entorno:

```bash
docker compose up -d auth-db redis backend
docker compose ps auth-db redis backend
```

Resultado:

- `auth-db`, `redis`, `backend` en estado `Up (healthy)`.
- Validaciones KAN-66 ejecutadas en contenedor `backend` (sin correr tests en host).

## 5) Riesgos residuales

- Riesgo residual: persiste un fallo de regresión no relacionado al scope KAN-66 en `create_user_email_failure_rolls_back_creation`; no bloquea la verificación focal de concurrencia/idempotencia, pero requiere seguimiento en ticket separado.
- Riesgo residual: no se modelan carreras reales multi-hilo en SQLite in-memory de tests; se cubre con simulación determinística (`IntegrityError` + lock assertions).

## 6) Rollback note

- Rollback funcional: revertir commit de KAN-66 restituye comportamiento previo sin migraciones ni cambios de contrato.
- Rollback operativo: no requiere cambios de datos; sólo redeploy de backend con commit anterior.

## 7) Referencias

- `backend/apps/administracion/use_cases/rbac_write/assign_user_roles.py`
- `backend/apps/administracion/use_cases/rbac_write/set_user_primary_role.py`
- `backend/apps/administracion/use_cases/rbac_write/revoke_user_role.py`
- `backend/apps/administracion/use_cases/rbac_write/upsert_user_override.py`
- `backend/apps/administracion/tests/test_rbac_services_and_utils.py`
- `backend/apps/administracion/tests/test_rbac_users_api.py`
- `docs/domains/auth-access/tdd-risk-strategy-kan-55.md`
- `docs/domains/auth-access/tdd-evidence-templates.md`
