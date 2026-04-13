# KAN-60 - Regresión funcional S1 + checklist pre-deploy (Go/No-Go)

> TL;DR: Se ejecutó regresión focalizada del slice Auth-Access Sprint 1 en entorno Docker-first, se detectó un hallazgo crítico de estabilidad en tests (`test_create_user_email_failure_rolls_back_creation`), se aplicó corrección mínima de prueba para alinear el contrato con `ALLOW_USER_CREATE_WITHOUT_EMAIL`, y la re-ejecución quedó en verde. Dictamen final: **GO condicionado** (sin blockers críticos abiertos).

## 1) Contexto y objetivo

- Ticket: `KAN-60`.
- Objetivo: validar regresión focalizada authn/authz del slice S1 y emitir recomendación de salida con evidencia trazable.
- Alcance ejecutado:
  - Backend RBAC/auth-access (contrato, authz matrix, users/roles/permissions, servicios utilitarios).
  - Frontend guards/capabilities y alineación contractual auth.
  - Verificación de salud de contenedores en Docker.

## 2) Matriz de criterios de aceptación (KAN-60)

| AC | Criterio Jira | Evidencia | Resultado |
|---|---|---|---|
| AC-1 | Checklist QA S1 con PASS/FAIL explícito por ítem | Sección 3 (checklist) + Sección 4 (logs de ejecución) | ✅ PASS |
| AC-2 | Hallazgos críticos abiertos implican NO-GO hasta mitigación | Se detectó 1 hallazgo crítico en backend tests; mitigado en esta misma ejecución y revalidado en verde | ✅ PASS |
| AC-3 | Dictamen QA GO/NO-GO con justificación | Sección 6 (dictamen final con riesgos residuales) | ✅ PASS |

## 3) Checklist QA S1 (resultado explícito)

| Ítem | Estado | Evidencia |
|---|---|---|
| Smoke operativo Docker (`auth-db`, `redis`, `backend`, `frontend`) | PASS | `docker compose up -d ...` + `docker compose ps` |
| Health backend estable durante regresión | PASS | `docker compose ps backend` -> `healthy` |
| Regresión backend auth-access focalizada | PASS | `155 tests / OK` (ver sección 4) |
| Regresión frontend guards/capabilities focalizada | PASS | `3 files / 16 tests / OK` (ver sección 4) |
| Hallazgos clasificados por severidad y estado | PASS | Sección 5 |
| Recomendación go/no-go documentada | PASS | Sección 6 |

## 4) Evidencia de ejecución (Docker-first)

### 4.1 Arranque y estado de servicios

```bash
docker compose up -d auth-db redis backend frontend
docker compose ps
```

Resultado observado:

- `auth-db`: `healthy`
- `redis`: `healthy`
- `backend`: `healthy`
- `frontend`: `up`

### 4.2 Regresión backend (auth-access)

Comando:

```bash
docker compose exec backend python manage.py test \
  apps.administracion.tests.test_rbac_contract \
  apps.administracion.tests.test_rbac_authz_matrix \
  apps.administracion.tests.test_rbac_roles_permissions_api \
  apps.administracion.tests.test_rbac_users_api \
  apps.administracion.tests.test_rbac_services_and_utils
```

Ejecución 1 (RED):

- `FAILED (failures=1)`
- Falla: `test_create_user_email_failure_rolls_back_creation`
- Síntoma: esperado `500 EMAIL_DELIVERY_FAILED`, recibido `201`.

Mitigación aplicada:

- `backend/apps/administracion/tests/test_rbac_users_api.py`
  - Se agrega `@override_settings(ALLOW_USER_CREATE_WITHOUT_EMAIL=False)` al test fallido para fijar precondición contractual del caso de rollback por fallo de email.

Ejecución 2 (GREEN):

- `Ran 155 tests in 282.299s`
- `OK`

### 4.3 Regresión frontend (guards + contrato)

Comando:

```bash
docker compose exec frontend bun run test:run \
  src/test/unit/router/ProtectedRoute.capabilities.test.tsx \
  src/test/unit/auth/useAuthCapabilities.test.tsx \
  src/test/integration/contracts/auth-contract-alignment.spec.ts
```

Resultado:

- `Test Files: 3 passed`
- `Tests: 16 passed`

## 5) Hallazgos y estado de mitigación

| ID | Severidad | Hallazgo | Estado |
|---|---|---|---|
| K60-H1 | Crítica | Prueba de rollback por fallo de email dependía implícitamente de configuración de entorno (`ALLOW_USER_CREATE_WITHOUT_EMAIL`) y no fijaba precondición, generando falso negativo en gate de regresión. | ✅ Cerrado en la misma ejecución (test hardening + revalidación completa). |

## 6) Dictamen QA (GO/NO-GO)

- **Resultado final:** ✅ **GO condicionado**.
- **Justificación técnica:** no quedan blockers críticos abiertos; la regresión backend/frontend del slice S1 quedó en verde en Docker y el hallazgo crítico detectado fue mitigado + revalidado en la misma corrida.
- **Riesgo residual:** bajo. Se recomienda mantener la política de fijar settings explícitos en pruebas sensibles a flags para evitar falsos negativos en gates de salida.

## 7) Impacto de módulos

- `backend/apps/administracion/tests/test_rbac_users_api.py` (hardening de test de rollback por email).
- `docs/domains/auth-access/` (acta de evidencia KAN-60).

## 8) Referencias

- Jira: `https://siresstc.atlassian.net/browse/KAN-60`
- Notion: `https://www.notion.so/32f123c6020081cab756d3a83ce38f62`
- Evidencias relacionadas:
  - `docs/domains/auth-access/kan-58a-s2-apply-evidence.md`
  - `docs/domains/auth-access/kan-59-apply-evidence.md`
  - `docs/domains/auth-access/kan-69-observability-baseline.md`

## 9) Addendum KAN-73 - RBAC user email failure contract hardening

Objetivo del addendum: dejar trazabilidad reproducible del hardening contractual de `POST /api/v1/users` ante falla de envio de credenciales, con evidencia TDD-first y Docker-first.

### RED -> GREEN (focal)

- **RED** (precondicion incorrecta intencional para probar sensibilidad al flag):

```bash
docker compose exec backend python manage.py test \
  apps.administracion.tests.test_rbac_users_api.RbacUsersApiTests.test_create_user_email_failure_tolerated_when_flag_enabled
```

Resultado RED observado:

- `FAILED (failures=1)`
- `AssertionError: 500 != 201`

- **GREEN** (precondicion contractual correcta con `@override_settings(ALLOW_USER_CREATE_WITHOUT_EMAIL=True)`):

```bash
docker compose exec backend python manage.py test \
  apps.administracion.tests.test_rbac_users_api.RbacUsersApiTests.test_create_user_email_failure_tolerated_when_flag_enabled
```

Resultado GREEN observado:

- `Ran 1 test ... OK`

### Validacion Docker-first final (suite RBAC focal)

```bash
docker compose up -d auth-db redis backend
docker compose exec backend python manage.py test \
  apps.administracion.tests.test_rbac_contract \
  apps.administracion.tests.test_rbac_authz_matrix \
  apps.administracion.tests.test_rbac_roles_permissions_api \
  apps.administracion.tests.test_rbac_users_api \
  apps.administracion.tests.test_rbac_services_and_utils
```

Resultado final observado:

- `Ran 156 tests ... OK`

### Cobertura contractual KAN-73 (AC-F1..AC-F4)

- `AC-F1 (flag=false)`: `500 EMAIL_DELIVERY_FAILED` + rollback validado en `test_create_user_email_failure_rolls_back_creation_in_strict_mode`.
- `AC-F2 (flag=true)`: `201` + persistencia + `credentialsEmailSent=false` validado en `test_create_user_email_failure_tolerated_when_flag_enabled`.
- `AC-F3 (determinismo)`: ambos branches forzados con `@override_settings(...)`.
- `AC-F4 (alineacion contrato)`: actualizada matriz en `docs/api/modules/rbac.md` con comportamiento dual por flag.
