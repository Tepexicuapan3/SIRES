## Summary

- Implementa KAN-65 en frontend admin con enfoque capability-first usando `GET /api/v1/auth/capabilities` como source of truth UX para rutas/acciones in-scope (`users/roles`).
- Mantiene estrategia híbrida incremental: `/auth/me` sigue como contrato de identidad/sesión; capabilities gobierna autorización UX admin.
- Cierra evidencia TDD-first por bloques A-D y cumplimiento governance para DoD sin introducir cambios funcionales fuera de alcance Block E.

## Jira + SDD Traceability

- Jira: `KAN-65`
- Epic: `KAN-46`
- SDD artifacts (Engram `project: SIRES_SHARED`):
  - `sdd/kan-65/explore`
  - `sdd/kan-65/proposal`
  - `sdd/kan-65/spec`
  - `sdd/kan-65/design`
  - `sdd/kan-65/tasks`
  - `sdd/kan-65/apply-progress`
- Engram persistence:
  - All SDD artifacts use `project: SIRES_SHARED` for cross-session recovery and team visibility.
  - `topic_key` pattern: `sdd/kan-65/{phase}` for stable artifact upsert behavior.
  - Session summaries include goal, discoveries, accomplished work, next steps, and relevant files.
  - Post-verify decisions and remediation steps persisted via `mem_save` with `type: decision` and `type: bugfix`.

## Evidencia documental (ruta -> decisión -> impacto)

| Ruta | Decisión aplicada | Impacto en este PR |
| --- | --- | --- |
| `docs/domains/auth-access/kan-65-admin-capabilities-apply-evidence.md` | Consolidar evidencia TDD A-D + AC traceability + riesgos/rollback de KAN-65. | PR queda evidence-first y review-ready para governance/TDD gate. |
| `docs/domains/auth-access/permissions-source-of-truth.md` | Registrar delta KAN-65: `/auth/capabilities` SoT UX admin; `/auth/me` solo identidad/sesión. | Reduce ambigüedad contractual y deriva entre docs y runtime. |
| `docs/api/modules/auth.md` | Explicitar uso operativo KAN-65 y fail-closed en error/degraded de capacidades. | Contrato API documentado consistente con comportamiento frontend actual. |
| `docs/guides/pr-merge-governance.md` | Aplicar gate de trazabilidad, TDD evidence y checklist de riesgo auth-access. | Cierre de compliance DoD sin gaps para merge. |

## Evidencia técnica / tests

### RED (evidencia histórica de implementación)
- Block A/B/C/D en artifacts SDD (`sdd/kan-65/tasks`, `sdd/kan-65/apply-progress`) y session summaries (`#467`, `#470`), con fallos iniciales esperados antes de código verde.

### GREEN / REFACTOR (validación actual en Docker)

```bash
docker compose exec frontend bun run test:run src/test/unit/auth/useAuthCapabilities.test.tsx
# 1 file passed, 6 passed

docker compose exec frontend bun run test:run src/test/unit/router/ProtectedRoute.capabilities.test.tsx
# 1 file passed, 5 passed

docker compose exec frontend bun run test:run src/test/integration/users/UsersPage.ui.test.tsx src/test/integration/roles/RolesPage.ui.test.tsx
# 2 files passed, 27 passed

docker compose exec frontend bun run test:run src/test/unit/auth/auth-mutations-sync.test.tsx src/test/unit/auth/auth-session-sync.test.ts src/test/unit/auth/auth-cache.test.ts src/test/unit/auth/auth-error-request-id.test.ts
# 4 files passed, 12 passed
```

## Riesgos y mitigaciones

- Riesgo: drift de cache entre sesión y capacidades.
  - Mitigación: invalidación coordinada + tests Block D.
- Riesgo: regressions de gating en nuevos módulos admin.
  - Mitigación: patrón capability-first + deny-by-default y reutilización de suite de guard/integration.
- Riesgo: UX degradada por error temporal de capabilities.
  - Mitigación: degraded-safe explícito, sin elevar privilegios por fallback.

## Rollback plan

1. Revertir wiring admin users/roles a guard previo.
2. Mantener `/auth/me` como continuidad de sesión.
3. Revertir helper de invalidación dual si aparece comportamiento inesperado.
4. Ejecutar subset de regresión auth/admin antes de cerrar rollback.

## Compliance checklist (DoD)

- [x] Scope único y acotado al ticket.
- [x] Trazabilidad Jira + SDD completa.
- [x] Evidencia TDD-first (RED/GREEN/REFACTOR) incluida por bloques.
- [x] Gate de riesgo auth-access (`P1`) documentado con cobertura proporcional.
- [x] Contrato documental auth/API actualizado en el mismo cambio.
- [x] No se agregaron cambios funcionales fuera de alcance Block E.
- [x] Evidencia de tests ejecutada en Docker (sin build).
- [x] Riesgos + mitigaciones + rollback plan explícitos.

## Out of scope (explícito)

- No se crea PR en esta fase (solo draft).
- No se introducen nuevos cambios de lógica en aplicación.
- No se modifican contratos backend.
