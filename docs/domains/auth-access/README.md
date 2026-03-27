# Dominio auth-access

Hub canonico del Dominio 1 de SIRES.

## Alcance del dominio

Este dominio cubre:

- Autenticacion
- Identidad
- Autorizacion
- Recuperacion de acceso
- Trazabilidad/auditoria de acceso

## Navegacion

- [`overview.md`](./overview.md) - contexto, limites y principios operativos del dominio.
- [`prd.md`](./prd.md) - PRD formal del dominio (fuente funcional principal).
- [`cierre-formal-mvp-fase2.md`](./cierre-formal-mvp-fase2.md) - cierre documental formal validado con cliente (MVP/Fase 2), reglas operativas, excepciones, KPIs y DoR para implementacion.
- [`baseline-as-is.md`](./baseline-as-is.md) - baseline tecnico versionado AS-IS (KAN-47) para trazabilidad y desbloqueo de KAN-48+.
- [`boundary-map-acl.md`](./boundary-map-acl.md) - boundary map + ACL tecnico canonico de `auth_access` (KAN-48) con guardrails para KAN-49/KAN-50/KAN-52/KAN-57.
- [`permissions-source-of-truth.md`](./permissions-source-of-truth.md) - slice runtime minimo de KAN-49 para consolidar backend source of truth de permisos efectivos/capabilities.
- [`rbac-db-ownership-migration-strategy.md`](./rbac-db-ownership-migration-strategy.md) - estrategia canonica de KAN-50 (ownership/migracion DB RBAC `managed=False`) en fases `expand -> migrate -> contract`.
- [`request-id-traceability-contract.md`](./request-id-traceability-contract.md) - contrato transversal de correlacion `X-Request-ID` para KAN-51 (preserva/genera/devuelve).
- [`rbac-views-extraction-slices-plan.md`](./rbac-views-extraction-slices-plan.md) - plan incremental de extraccion de `rbac_views` por slices desplegables con estrategia de coexistencia/rollback (KAN-52).
- [`tdd-risk-strategy-kan-55.md`](./tdd-risk-strategy-kan-55.md) - matriz TDD-first por riesgo (P0/P1/P2) por slice `S0..S6` y gate go/no-go (KAN-55).
- [`tdd-evidence-templates.md`](./tdd-evidence-templates.md) - plantillas obligatorias de evidencia Red->Green->Refactor para Jira/PR (KAN-55).
- [`tdd-exception-policy.md`](./tdd-exception-policy.md) - politica formal de excepciones TDD con aprobacion, vencimiento y controles compensatorios (KAN-55).
- [`pending-decisions.md`](./pending-decisions.md) - acta de cierre de decisiones historicamente pendientes (estado final resuelto).
- [`backlog-mapping.md`](./backlog-mapping.md) - mapeo entre PRD y backlog de ejecucion (Jira/SDD).
- [`decision-log.md`](./decision-log.md) - registro de decisiones del dominio.
- [`changelog.md`](./changelog.md) - historial de cambios documentales del dominio.

## Regla anti-duplicidad

Este `README.md` funciona como hub. El detalle vive en los documentos tematicos para evitar duplicacion.

## Estado de migracion

- Fuente canonica actual: `docs/domains/auth-access/*`.
- Rutas legacy de referencia (deprecadas):
  - `docs/guides/prd-dominio-1-auth-access.md`
  - `docs/guides/prd-dominio-1-auth-access-pendientes-reunion.md`

## Separacion de alcance KAN-50 vs KAN-57

- **KAN-50**: estrategia DB ownership/migracion RBAC (`managed=False`).
- **KAN-57**: hardening runtime de enforcement/autorizacion.
