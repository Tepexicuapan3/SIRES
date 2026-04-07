# KAN-62 - Hardening operativo del switch read-only RBAC

> TL;DR: KAN-62 consolida el control operativo de lectura RBAC con una única variable `RBAC_READ_SLICE_SOURCE` (`legacy|s1|auto`) y mantiene compatibilidad hacia atrás con `RBAC_READ_S1_ENABLED` para rollback inmediato sin romper contrato HTTP.

## 1) Contexto

El slice S1 de lectura RBAC (KAN-56) ya estaba activo con flag booleana `RBAC_READ_S1_ENABLED`. KAN-62 agrega un control explícito por fuente para evitar ambigüedad operativa y estandarizar rollout/rollback.

Implementación asociada:

- `backend/config/settings.py`
- `backend/apps/administracion/services/rbac_feature_flags.py`
- `backend/apps/administracion/views/rbac_read_views.py`
- `backend/apps/administracion/views/rbac_views.py`

## 2) Variables operativas válidas

### `RBAC_READ_SLICE_SOURCE`

- Valores válidos: `legacy`, `s1`, `auto`
- Default: `auto`
- Semántica:
  - `legacy`: fuerza lectura legacy
  - `s1`: fuerza lectura S1
  - `auto`: usa `RBAC_READ_S1_ENABLED` como fallback de compatibilidad

### `RBAC_READ_S1_ENABLED`

- Tipo: boolean (`true|false`)
- Uso actual: fallback cuando `RBAC_READ_SLICE_SOURCE=auto` o valor inválido

## 3) Precedencia oficial (fuente de verdad)

Orden de evaluación en runtime:

1. Leer y normalizar `RBAC_READ_SLICE_SOURCE` (`strip().lower()`).
2. Si vale `s1` o `legacy`, **esa decisión gana**.
3. Si vale `auto` o un valor inválido, evaluar `RBAC_READ_S1_ENABLED`:
   - `true` -> source final `s1`
   - `false` -> source final `legacy`

### Matriz rápida de decisión

| RBAC_READ_SLICE_SOURCE | RBAC_READ_S1_ENABLED | source efectiva |
| --- | --- | --- |
| `s1` | `false` | `s1` |
| `legacy` | `true` | `legacy` |
| `auto` | `true` | `s1` |
| `auto` | `false` | `legacy` |
| `INVALID` | `true` | `s1` |
| `INVALID` | `false` | `legacy` |

## 4) Runbook de rollback explícito a legacy

### Rollback inmediato (recomendado)

1. Configurar:
   - `RBAC_READ_SLICE_SOURCE=legacy`
2. Redeploy de backend.
3. Verificación post-rollback:
   - `GET /api/v1/roles`
   - `GET /api/v1/roles/{id}`
   - `GET /api/v1/permissions`
4. Confirmar en auditoría `meta.source="legacy"` para eventos:
   - `RBAC_ROLE_LIST`
   - `RBAC_ROLE_DETAIL`
   - `RBAC_PERMISSION_LIST`

### Rollback compatible (modo auto)

Si se mantiene `RBAC_READ_SLICE_SOURCE=auto`:

1. Configurar `RBAC_READ_S1_ENABLED=false`.
2. Redeploy backend.
3. Validar `meta.source="legacy"` en los mismos eventos.

## 5) Contrato y alcance

- No hay cambios de rutas/payload/status en RBAC read-only.
- No hay cambios de schema/migraciones.
- El cambio es operativo (routing interno + gobernanza de rollback).

## 6) Evidencia mínima recomendada en PR/Jira

- Captura de configuración aplicada (`RBAC_READ_SLICE_SOURCE`).
- Resultado de pruebas backend RBAC read-path en Docker-first.
- Verificación de `meta.source` en auditoría para la ruta activa.

## Referencias

- `docs/domains/auth-access/kan-56-s1-apply-evidence.md`
- `docs/domains/auth-access/rbac-views-extraction-slices-plan.md`
- `docs/api/modules/rbac.md`
