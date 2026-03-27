# KAN-56 - Evidencia de apply S1 read-only RBAC

> TL;DR: KAN-56 implementa el slice S1 (`GET /roles`, `GET /roles/{id}`, `GET /permissions`) con delegación híbrida por feature flag `RBAC_READ_S1_ENABLED`, manteniendo contrato público estable y evidencia TDD Red->Green->Refactor.

## 1) Scope freeze y precondiciones

- Precondición KAN-55: **cumplida** (`sdd/kan-55/archive-report`, `sdd/kan-55/state`).
- Conflictos documentales auth-access: **resueltos** (sin `<<<<<<<`).
- Scope freeze KAN-56: **solo endpoints read-only S1**, sin mutaciones RBAC.

## 2) Implementación técnica (sin breaking contract)

### Nuevas piezas S1

- `backend/apps/administracion/policies/rbac_read_policy.py`
  - Policy centralizada para autorización atómica de lectura.
- `backend/apps/administracion/repositories/rbac_read_repository.py`
  - Repositorio read-only para consultas RBAC S1.
- `backend/apps/administracion/use_cases/rbac_read/*`
  - Casos de uso `list_roles`, `get_role_detail`, `list_permissions`.
- `backend/apps/administracion/services/rbac_read_serializers.py`
  - Serialización contract-first en camelCase.
- `backend/apps/administracion/views/rbac_read_views.py`
  - Adapter DRF read-only con auditoría `meta.source = "s1"`.

### Integración híbrida y rollback inmediato

- `backend/apps/administracion/views/rbac_views.py`
  - Wrappers de `GET` delegan a S1 cuando flag `RBAC_READ_S1_ENABLED=true`.
  - Fallback legacy automático con `RBAC_READ_S1_ENABLED=false`.
  - Auditoría legacy etiquetada con `meta.source = "legacy"`.
- `backend/config/settings.py`
  - Nueva flag `RBAC_READ_S1_ENABLED` (default `False`).

## 3) Evidencia TDD-first (Red -> Green -> Refactor)

### Red

Se agregaron pruebas primero y fallaron por:
- módulos S1 inexistentes (`ModuleNotFoundError`),
- ausencia de `meta.source` en auditoría,
- ausencia de contrato S1 en rutas read-only.

### Green

Con implementación mínima S1 + delegación por flag, pasaron las suites objetivo.

### Refactor

- Separación de capas (policy/use_case/repository/serializer/view) sin romper contrato HTTP.
- Conservación de rutas y payloads públicos.

## 4) Validación ejecutada

### Suite principal KAN-56 (PASS)

```bash
docker compose exec backend sh -lc 'python manage.py test \
  apps.administracion.tests.test_rbac_roles_permissions_api \
  apps.administracion.tests.test_rbac_contract \
  apps.administracion.tests.test_rbac_authz_matrix \
  apps.administracion.tests.test_rbac_services_and_utils'
```

Resultado: **75 tests / OK**.

### Nota de regresión adicional (fuera de scope S1)

Se ejecutó también `test_rbac_users_api` como smoke extendido y apareció una falla preexistente dependiente de configuración de entorno (`ALLOW_USER_CREATE_WITHOUT_EMAIL`) en `test_create_user_email_failure_rolls_back_creation`. No bloquea KAN-56 S1 porque no toca mutaciones de usuarios.

## 5) Checklist rollout/rollback operativo (S1)

### Dark launch

- [x] Deploy con `RBAC_READ_S1_ENABLED=false`.
- [x] Verificar respuestas legacy estables en endpoints S1.

### Canary interno

- [x] Activar `RBAC_READ_S1_ENABLED=true` en entorno controlado.
- [x] Validar `meta.source="s1"` en eventos de auditoría `RBAC_ROLE_LIST`, `RBAC_ROLE_DETAIL`, `RBAC_PERMISSION_LIST`.
- [x] Validar paridad contractual (status + campos requeridos).

### Rollback drill

- [x] Setear `RBAC_READ_S1_ENABLED=false`.
- [x] Confirmar retorno inmediato a ruta legacy (`meta.source="legacy"`).
- [x] Sin cambios de contrato HTTP en clientes.

## 6) Mapeo Tasks KAN-56 -> estado

- Phase 0: **completa** (preflight + freeze).
- Phase 1: **completa** (tests RED para contrato, authz, auditoría, kill switch).
- Phase 2: **completa** (policy/repository/use cases/serializers/views/flag).
- Phase 3: **completa** (refactor por capas + validación de contrato/auditoría/frontera).
- Phase 4: **completa en entorno de desarrollo controlado** (dark launch/canary/rollback drill por flag + evidencia).

## 7) Riesgos residuales

- Falta validación de umbrales p95/error-rate en ambiente productivo real.
- Existe regresión no-S1 en tests de usuarios por configuración de entorno (seguimiento separado recomendado).
