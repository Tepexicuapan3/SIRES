# KAN-65 - Evidencia de implementación (Block E cierre documental + evidencia PR)

> TL;DR: KAN-65 deja `GET /api/v1/auth/capabilities` como source of truth UX para gating admin (users/roles) con estrategia TDD-first por bloques A-D, `deny-by-default` en estados no confiables y sincronía `session + capabilities`.

## 1) Scope ejecutado

- Ticket: `KAN-65`
- Epic: `KAN-46`
- Dominio: `auth-access` (`hybrid`)
- Fase SDD: `APPLY` (Block E: cierre documental + evidencia PR)

En alcance de implementación (A-D, ya ejecutado):

- Block A: contrato/frontend query para `/auth/capabilities`.
- Block B: guard + rutas admin capability-first.
- Block C: módulos admin users/roles en modo fail-closed (`enabled:false`, loading/degraded-safe).
- Block D: sincronía de invalidación `session + capabilities` + trazabilidad `requestId` en errores auth.

Fuera de alcance:

- Cambios de contrato backend.
- Cambios de lógica de negocio adicional fuera de KAN-65.
- Reescritura global de authz frontend fuera de flujo admin in-scope.

## 2) Evidencia TDD-first por bloques (RED -> GREEN -> REFACTOR)

Riesgo declarado KAN-65: **P1** (authz UX admin + sync auth cache).

### Block A — Contract + Hook (`useAuthCapabilities`)

**RED**
- Evidencia en tasks artifact (`sdd/kan-65/tasks`): pruebas iniciales para contrato `/auth/capabilities` + deny-by-default en missing capability y errores 401/403/500/network.

**GREEN (estado verificable actual)**
```bash
docker compose exec frontend bun run test:run src/test/unit/auth/useAuthCapabilities.test.tsx
```
- Resultado: `1 file passed`, `6 passed`.

**REFACTOR**
- Tipos/contrato consolidados para proyección dedicada (`AuthCapabilitiesResponse`) sin romper `/auth/me`.

### Block B — Guard + Route gating

**RED**
- Evidencia en sesión `#467` y tasks artifact: `ProtectedRoute.capabilities` inició con fallos esperados (loading/error/wiring route capability).

**GREEN (estado verificable actual)**
```bash
docker compose exec frontend bun run test:run src/test/unit/router/ProtectedRoute.capabilities.test.tsx
```
- Resultado: `1 file passed`, `5 passed`.

**REFACTOR**
- `ProtectedRoute` prioriza capability en rutas que la declaran y aplica fail-closed en error de capacidades.

### Block C — Admin users/roles modules

**RED**
- Evidencia en sesión `#470` y tasks artifact: tests de integración añadidos para deny/loading/degraded y bloqueo de llamadas no autorizadas.

**GREEN (estado verificable actual)**
```bash
docker compose exec frontend bun run test:run src/test/integration/users/UsersPage.ui.test.tsx src/test/integration/roles/RolesPage.ui.test.tsx
```
- Resultado: `2 files passed`, `27 passed`.

**REFACTOR**
- Helper compartido de gating (`capabilities-gating.ts`) para homogeneizar lógica y notices degraded-safe.

### Block D — Session/capabilities sync + traceability

**RED**
- Evidencia en `sdd/kan-65/apply-progress` previo: fallos esperados por invalidación incompleta de capabilities y ausencia de `requestId` normalizado.

**GREEN (estado verificable actual)**
```bash
docker compose exec frontend bun run test:run src/test/unit/auth/auth-mutations-sync.test.tsx src/test/unit/auth/auth-session-sync.test.ts src/test/unit/auth/auth-cache.test.ts src/test/unit/auth/auth-error-request-id.test.ts
```
- Resultado: `4 files passed`, `12 passed`.

**REFACTOR**
- Util compartido `invalidateAuthSessionAndCapabilities` reduce duplicación y fija coherencia de invalidación.

## 3) Trazabilidad AC KAN-65 -> artefactos/tests

| AC | Cobertura de implementación | Evidencia principal |
|---|---|---|
| `KAN-65-AC1` capacidades como source of truth UX admin | `useAuthCapabilities`, `ProtectedRoute`, rutas admin users/roles con `requiredCapability` | `src/test/unit/auth/useAuthCapabilities.test.tsx`, `src/test/unit/router/ProtectedRoute.capabilities.test.tsx` |
| `KAN-65-AC2` deny-by-default en missing/error/degraded | fail-closed en guard + módulos users/roles, `enabled:false` en queries críticas | `UsersPage.ui.test.tsx`, `RolesPage.ui.test.tsx`, `ProtectedRoute.capabilities.test.tsx` |
| `KAN-65-AC3` no role-string checks críticos como source | gating crítico users/roles migrado a capability-first | `admin.routes.config.tsx`, `ProtectedRoute.tsx` + tests Block B/C |
| `KAN-65-AC4` estados loading/error/degraded privilege-safe | loading-safe + degraded-safe documentado y testeado | tests Block B/C + notas en sessions `#467/#470` |
| `KAN-65-AC5` sync session/capabilities + request traceability | invalidación dual login/logout/refresh y normalización `requestId` | `auth-mutations-sync`, `auth-session-sync`, `auth-cache`, `auth-error-request-id` |

## 4) Evidencia documental (ruta -> decisión -> impacto)

| Ruta | Decisión | Impacto |
|---|---|---|
| `docs/domains/auth-access/permissions-source-of-truth.md` | KAN-65 consume proyección dedicada `/auth/capabilities` para admin UX in-scope (`users/roles`) manteniendo `/auth/me` para sesión/identidad. | Evita drift de contrato y deja explícito el boundary identity vs authorization UX. |
| `docs/api/modules/auth.md` | Se explicita uso operativo de `/auth/capabilities` por frontend admin y fallback fail-closed en error de capacidades. | Alinea contrato API con comportamiento real del frontend en KAN-65. |
| `docs/guides/pr-merge-governance.md` | Se aplica checklist de trazabilidad Jira+SDD, evidencia TDD-first y gate de riesgo auth-access. | PR queda review-ready sin gaps de governance/documentación. |

## 5) Riesgos y mitigaciones

- Riesgo: drift futuro entre `/auth/me` y `/auth/capabilities`.
  - Mitigación: invalidación coordinada y tests Block D.
- Riesgo: regresión de gating en nuevas rutas admin no migradas.
  - Mitigación: capability-first como regla para rutas críticas nuevas + suite de guard/integration reutilizable.
- Riesgo: degradación UX por fallos transitorios de capabilities.
  - Mitigación: degraded-safe explícito con deny-by-default en acciones privilegiadas.

## 6) Rollback plan

1. Revertir wiring de rutas admin in-scope a flujo previo de guard.
2. Mantener `/auth/me` como ruta de continuidad de sesión (sin tocar backend).
3. Revertir helper de invalidación dual si produce side effects no previstos.
4. Ejecutar subset de regresión auth/admin y validar acceso mínimo de continuidad.

## 7) Compliance DoD (Block E)

- [x] Evidencia TDD por bloques A-D consolidada (RED/GREEN/REFACTOR).
- [x] Trazabilidad `KAN-65-AC1..AC5` mapeada a artefactos/tests.
- [x] Contrato documental auth-access/API alineado con runtime real.
- [x] PR evidence-first draft preparado (sin abrir PR).
- [x] Sin cambios funcionales adicionales fuera de alcance Block E.

## 8) Referencias

- `docs/domains/auth-access/tdd-evidence-templates.md`
- `docs/domains/auth-access/permissions-source-of-truth.md`
- `docs/api/modules/auth.md`
- `docs/guides/pr-merge-governance.md`
- `docs/guides/domain-dor-dod.md`
