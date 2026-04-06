# KAN-58A - Evidencia de apply S2 mutaciones de roles

> TL;DR: KAN-58A implementa el slice S2 de `rbac_views` para `POST /roles`, `PUT /roles/{id}` y `DELETE /roles/{id}` con delegacion hibrida por feature flag `RBAC_ROLE_MUTATION_S2_ENABLED`, manteniendo contrato HTTP estable, trazabilidad Jira/PR explicita y evidencia TDD Red -> Green -> Refactor Docker-first sin `pip install` ad-hoc.

## 0) Trazabilidad Jira <-> PR

- Ticket principal de alcance: `KAN-58` (`58-A`, sprint demo S1).
- Ticket relacionado y explicitamente fuera de alcance de esta PR: `KAN-72` (`58-B`, sprint 2+).
- PR asociada: `https://github.com/Luis-Ant/SIRES/pull/50`.
- Declaracion operativa: esta PR mantiene `58-A` como alcance contractual; lo diferido de mutaciones/hardening extendido permanece en `KAN-72`.

## 1) Scope freeze 58-A

### In scope

- Extraccion S2 de mutaciones de roles (`create`, `update`, `delete`).
- Policy/use cases/repository/views dedicados para S2.
- Kill switch por flag para rollback inmediato (`RBAC_ROLE_MUTATION_S2_ENABLED`).
- Evidencia TDD-first en tests de API/auditoria.

### Out of scope

- S3 permisos por rol (`POST /permissions/assign`, `DELETE /permissions/roles/...`) - queda para 58-B / KAN-72.
- S4+ usuarios, roles por usuario y overrides.
- Cambios de contrato publico en rutas/payloads existentes.

## 2) Implementacion tecnica

### Nuevas piezas S2

- `backend/apps/administracion/policies/rbac_role_mutation_policy.py`
  - Autenticacion, permisos atomicos y validacion CSRF para mutaciones de roles.
- `backend/apps/administracion/repositories/rbac_role_mutation_repository.py`
  - Acceso de datos encapsulado para ciclo de vida de roles S2.
- `backend/apps/administracion/use_cases/rbac_role_mutation/*`
  - Casos de uso para crear, actualizar y eliminar roles + excepciones de dominio aplicativas.
- `backend/apps/administracion/views/rbac_role_mutation_views.py`
  - Adaptadores DRF S2 con auditoria `meta.source = "s2"`.

### Integracion hibrida / rollback

- `backend/apps/administracion/views/rbac_views.py`
  - Wrappers de `POST /roles`, `PUT /roles/{id}` y `DELETE /roles/{id}` delegan a S2 cuando `RBAC_ROLE_MUTATION_S2_ENABLED=true`.
  - Fallback legacy inmediato cuando la flag esta en `false`.
- `backend/config/settings.py`
  - Nueva flag `RBAC_ROLE_MUTATION_S2_ENABLED` (default `False`).
- `.env.example`
  - Se documenta la nueva flag junto con `RBAC_READ_S1_ENABLED`.

## 3) Evidencia TDD-first (Red -> Green -> Refactor)

### Red

Se escribieron primero tres pruebas de auditoria S2 en `test_rbac_roles_permissions_api.py`:

- `test_create_role_records_s2_source_when_mutation_flag_enabled`
- `test_update_role_records_s2_source_when_mutation_flag_enabled`
- `test_delete_role_records_s2_source_when_mutation_flag_enabled`

Evidencia de falla inicial:

- Resultado: `FAILED (failures=3)`
- Motivo: `event.meta.source` devolvia `legacy` en lugar de `s2`.

### Green

Con implementacion minima S2 + delegacion por flag:

- Resultado suite objetivo: `Ran 5 tests ... OK`.

### Refactor

- Se separo policy/repository/use_cases/views para mutaciones de roles sin alterar rutas ni payloads.
- Se mantuvo rollback inmediato por feature flag para minimizar blast radius.

## 4) Validacion ejecutada (Docker-first)

### Suite objetivo S2 (PASS)

```bash
docker compose run --rm backend sh -lc "python manage.py test \
  apps.administracion.tests.test_rbac_roles_permissions_api.RbacRolesPermissionsApiTests.test_create_role_records_s2_source_when_mutation_flag_enabled \
  apps.administracion.tests.test_rbac_roles_permissions_api.RbacRolesPermissionsApiTests.test_update_role_records_s2_source_when_mutation_flag_enabled \
  apps.administracion.tests.test_rbac_roles_permissions_api.RbacRolesPermissionsApiTests.test_delete_role_records_s2_source_when_mutation_flag_enabled \
  apps.administracion.tests.test_rbac_services_and_utils.RbacRoleMutationToggleTests"
```

Resultado: **5 tests / OK**.

### Regresion RBAC relevante (PASS)

```bash
docker compose run --rm backend sh -lc "python manage.py test \
  apps.administracion.tests.test_rbac_roles_permissions_api \
  apps.administracion.tests.test_rbac_contract \
  apps.administracion.tests.test_rbac_authz_matrix \
  apps.administracion.tests.test_rbac_services_and_utils"
```

Resultado: **80 tests / OK**.

### Validacion de bootstrap backend (PASS)

```bash
docker compose up -d auth-db redis backend
docker compose ps backend
docker compose logs backend --since 30s --no-color
```

Resultado: backend estable (sin restart-loop), migraciones en verde y `daphne` escuchando en `0.0.0.0:5000`.

### Reproducibilidad de dependencias de test

- `Pillow` y `oracledb` permanecen declaradas en `backend/requirements.txt` y se instalan por imagen (`backend/Dockerfile`), sin dependencia de `pip install` manual en comandos de test.
- Se agregó tolerancia explícita a faltantes de `Pillow/oracledb` en import-time para evitar fallas de arranque del servicio cuando una imagen local está desfasada; el uso real de esas capacidades sigue fallando de forma explícita en runtime si la dependencia no existe.

## 5) Riesgos y mitigacion

- `RBAC_ROLE_MUTATION_S2_ENABLED` default `false` para dark launch y rollback inmediato.
- El scope se mantiene aislado a S2; endpoints de permisos por rol no se tocaron.
- Trazabilidad de auditoria preservada con `meta.domain = "auth_access"` y `meta.source = "s2"`.
