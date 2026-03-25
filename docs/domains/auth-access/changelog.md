# auth-access - Changelog

## 2026-03-24 (KAN-52 plan de extraccion rbac_views)

- Se agrega `rbac-views-extraction-slices-plan.md` con inventario de rutas RBAC, backlog priorizado de slices (`S0` a `S6`) y secuencia ejecutable por riesgo/dependencias.
- Se define estrategia de coexistencia legacy/nuevo sin cambios de contrato HTTP en KAN-52, con criterios de corte y rollback por iteracion.
- Se corrige trazabilidad de alcance en `backlog-mapping.md` para alinear KAN-52 al plan de extraccion de `rbac_views` (y no a auditoria/trazabilidad).
- Se actualiza discoverability en `docs/domains/auth-access/README.md` y `docs/README.md`.
## 2026-03-24 (KAN-51 X-Request-ID E2E)

- Se agrega `request-id-traceability-contract.md` como contrato canonico de propagacion request-id (`entrypoint -> middleware -> use case -> response`).
- Se actualiza discoverability en `docs/domains/auth-access/README.md`, `docs/README.md` y `backlog-mapping.md` para trazabilidad de KAN-51.
- Se explicita cobertura inicial de rutas criticas y pendientes de barrido completo para correlacion operacional.

## 2026-03-24 (KAN-50 DB ownership/migracion RBAC)

- Se agrega `rbac-db-ownership-migration-strategy.md` como artefacto canonico de estrategia DB para KAN-50 (`managed=False`).
- Se documenta plan incremental `expand -> migrate -> contract` con checkpoints verificables, matriz de integridad, concurrencia/idempotencia y rollback por fase.
- Se corrige trazabilidad de alcance en `README.md`, `backlog-mapping.md`, `permissions-source-of-truth.md` y `decision-log` para separar KAN-50 (DB) de KAN-57 (runtime).

## 2026-03-24 (KAN-57 runtime hardening)

- Se extiende `strictCapabilityPrefixes` con `flow.somatometria.` para mantener `deny by default` en el flujo clinico pendiente.
- `capture_vitals_usecase` migra de bypass por role string a capability enforcement centralizado (`flow.somatometria.capture`).
- `visits.stream` realtime migra de allow-list ad-hoc por roles/permisos a policy centralizada por capability (`flow.visits.queue.read`).
- Se mantiene trazabilidad historica, pero se reclasifica como alcance de KAN-57 y no de KAN-50.

## 2026-03-23 (KAN-49 slice runtime)

- Se agrega `permissions-source-of-truth.md` como artefacto canonico de fuente unica de permisos/capabilities para KAN-49.
- Se documenta contrato canonico backend->frontend (`permissions`, `effectivePermissions`, `capabilities`, `permissionDependenciesVersion`) y semantica `deny by default`.
- Se registra mapeo AC KAN-49 -> evidencia por rutas runtime/tests/docs.
- Se explicita que la migracion runtime de somatometria queda fuera de este ticket (pendiente para KAN-57/KAN-52 o siguiente slice).

## 2026-03-23

- Se crea la estructura canonica `docs/domains/auth-access/`.
- Se migra PRD desde `docs/guides/prd-dominio-1-auth-access.md` a `docs/domains/auth-access/prd.md`.
- Se migra guia de pendientes desde `docs/guides/prd-dominio-1-auth-access-pendientes-reunion.md` a `docs/domains/auth-access/pending-decisions.md`.
- Se agregan `overview.md`, `backlog-mapping.md`, `decision-log.md` y `README.md` como base de governance documental del dominio.
- Se mantiene compatibilidad con stubs legacy en `docs/guides/` (deprecados).
- Se agrega `baseline-as-is.md` como baseline tecnico versionado AS-IS del dominio para KAN-47.
- Se agrega `boundary-map-acl.md` como artefacto canonico de Boundary Map + ACL tecnico del dominio para KAN-48.
- Se actualizan indices de discoverability en `docs/domains/auth-access/README.md` y `docs/README.md`.
- Se registra cierre documental de baseline en `decision-log.md`.
- Se registra decision de aceptacion de KAN-48 en `decision-log.md` y dependencia explicita KAN-48 -> KAN-49/KAN-50/KAN-52/KAN-57 en `backlog-mapping.md`.
