# auth-access - Estrategia TDD-first por riesgo (KAN-55)

> TL;DR: KAN-55 define un gate operativo por riesgo (`P0/P1/P2`) para slices `S0..S6` de auth-access. Sin clasificación de riesgo ni evidencia Red->Green->Refactor, no hay `sdd-apply` ni merge.

## 1) Objetivo y alcance

Este artefacto convierte la governance global en reglas ejecutables por slice para `auth-access`.

Incluye:
- Clasificación determinística de riesgo por slice (`P0/P1/P2`).
- Matriz mínima de cobertura por riesgo.
- Gate explícito de insuficiencia de evidencia (go/no-go).
- Guardrails no negociables de arquitectura/seguridad/auditoría.
- Criterio formal de desbloqueo para KAN-56.

No incluye:
- Implementación runtime/backend/frontend.
- Refactor técnico de `rbac_views`.
- Migraciones DB.

## 2) Precondiciones bloqueantes

Antes de iniciar apply de KAN-55/KAN-56, deben cumplirse TODAS:

1. Docs canónicas `docs/domains/auth-access/*.md` sin merge markers.
2. Alineación explícita con:
   - `docs/guides/pr-merge-governance.md`
   - `docs/guides/domain-dor-dod.md`
3. Criterios de aceptación publicados y trazables en Jira/SDD.

Si alguna falta: estado `blocked`.

### 2.1 Checklist de alineación baseline (KAN-55)

| Ítem | Estado | Acción |
|---|---|---|
| Conflictos docs canónicas auth-access | Resuelto | Merge markers removidos en `boundary-map-acl.md`, `backlog-mapping.md`, `request-id-traceability-contract.md`, `decision-log.md`, `changelog.md`. |
| Alineación con PR governance | Resuelto | `docs/guides/pr-merge-governance.md` actualizado con gate KAN-55 por riesgo. |
| Alineación con DoR/DoD | Resuelto | `docs/guides/domain-dor-dod.md` actualizado con criterios por riesgo. |
| Criterio desbloqueo KAN-56 | Resuelto | Definido en sección 10 de este documento y reflejado en estado SDD. |

## 3) Clasificación de riesgo (determinística)

Factores obligatorios por slice:
- `auth/session impact`
- `permission-policy impact`
- `audit impact`
- `mutation criticality`
- `cross-domain coupling risk`

Regla operativa:
- **P0**: toca autorización crítica, mutaciones sensibles o alto impacto en auditoría/compliance.
- **P1**: cambio relevante pero acotado (mutación controlada o preparación estructural con impacto indirecto).
- **P2**: lectura aislada y bajo riesgo operativo.

## 4) Matriz de riesgo por slices KAN-52 (`S0..S6`)

| Slice | Risk | auth/session | policy | audit | mutation | cross-domain | Justificación |
|---|---|---|---|---|---|---|---|
| S0 Preparación | P1 | Medio | Medio | Medio | Bajo | Bajo | Prepara contrato transversal y baseline; no es puramente read-only.
| S1 Read-only catálogo RBAC | P2 | Bajo | Bajo | Medio | Bajo | Bajo | Solo GET (`/roles`, `/roles/{id}`, `/permissions`) sin mutaciones.
| S2 Mutaciones de roles | P1 | Medio | Alto | Alto | Alto | Medio | Cambia estado de roles, requiere política y auditoría consistentes.
| S3 Permisos por rol | P0 | Alto | Alto | Alto | Alto | Medio | Impacta autorización efectiva de múltiples flujos.
| S4 Usuarios base RBAC | P0 | Alto | Alto | Alto | Alto | Medio | Afecta ciclo de vida de usuarios y exposición de acceso.
| S5 Roles por usuario | P0 | Alto | Alto | Alto | Alto | Medio | Cambia asignación primaria/secundaria con alto blast radius.
| S6 Overrides | P0 | Alto | Alto | Alto | Alto | Alto | Cambios excepcionales de permisos con riesgo cross-domain/compliance.

## 5) Cobertura mínima obligatoria por riesgo

| Riesgo | RED (falla inicial) | GREEN (mínimo cambio) | REFACTOR | Mínimos de cobertura |
|---|---|---|---|---|
| P0 | Obligatorio para TODAS las reglas críticas declaradas | Obligatorio | Obligatorio + no regresión | >=2 integration/API + >=1 E2E crítico + unit/service relevante |
| P1 | Obligatorio para reglas core del cambio | Obligatorio | Obligatorio | >=1 integration/API + unit/service relevante |
| P2 | Obligatorio para comportamiento modificado | Obligatorio | Obligatorio | unit/service para comportamiento afectado |

Gate de insuficiencia:
- Si falta evidencia mínima por riesgo -> **DoD fail** + **merge bloqueado**.

## 6) Guardrails no negociables (criterios de rechazo)

1. Prohibido role-string ad-hoc como fuente de seguridad.
2. Prohibido acceso directo cross-domain a tablas/esquemas/modelos internos.
3. Prohibido breaking API no versionado.
4. Backend es source-of-truth de autorización.
5. Operaciones sensibles requieren contrato de auditoría mínimo.

## 7) Validación obligatoria de trazabilidad y auditoría

Para evidencia aceptable (especialmente P0/P1):
- Error estable con `requestId` en payload.
- Header `X-Request-ID` presente en respuesta.
- Evento de auditoría con mínimo:
  `actor`, `timestamp`, `action`, `domain`, `resource`, `result`, `contextId/requestId`, `ip`, `userAgent` (si disponible).

## 8) Política de umbral E2E para P1

Por defecto P1 **no** exige E2E.
P1 pasa a exigir >=1 E2E cuando se cumple al menos una:
- cambio en auth/session boundary,
- impacto en política de autorización de rutas críticas,
- incidente previo en el flujo en las últimas 2 releases,
- dependencia cross-domain con consistencia eventual.

## 9) Excepciones TDD (resumen operativo)

Referencia completa: `tdd-exception-policy.md`.

Regla de aprobación:
- **Blast radius low/medium**: `domain_owner`.
- **Blast radius high**: aprobación dual `domain_owner + security_owner`.

Excepción sin campos completos -> rechazada.

## 10) Go/No-Go para KAN-56

KAN-56 queda **unblocked** solo si:
- KAN-55 documentado y trazable (este artefacto + templates + policy).
- Conflictos docs auth-access resueltos.
- Gate de governance actualizado (PR template + guides).

Si cualquier condición cae, KAN-56 vuelve a `blocked` hasta remediación.

## 11) Referencias

- `docs/domains/auth-access/rbac-views-extraction-slices-plan.md`
- `docs/domains/auth-access/tdd-evidence-templates.md`
- `docs/domains/auth-access/tdd-exception-policy.md`
- `docs/guides/pr-merge-governance.md`
- `docs/guides/domain-dor-dod.md`

## 12) Acta de cierre documental KAN-55

### 12.1 Matriz de cumplimiento contra spec

| Requirement (spec) | Evidencia |
|---|---|
| Risk classification P0/P1/P2 | Secciones 3 y 4 |
| Minimum coverage matrix by risk | Sección 5 |
| Guardrails no negociables | Sección 6 |
| Blocking preconditions | Sección 2 + 2.1 |
| Controlled TDD exception policy | Sección 9 + `tdd-exception-policy.md` |

### 12.2 Resolución de open questions

- **Aprobación excepción high impact**: definida como aprobación dual `domain_owner + security_owner`.
- **Umbral E2E para P1**: definido en sección 8 (condicional por impacto/riesgo operativo).
- **Política de bloqueo por requestId/auditoría**: se mantiene gate estricto en P0/P1 y validación explícita en evidencia.

### 12.3 Estado final

- **KAN-55**: `ready-for-verify` (fase apply completada a nivel documental).
- **KAN-56**: elegible para desbloqueo de preflight, sujeto a validación final de estado SDD/Jira.
