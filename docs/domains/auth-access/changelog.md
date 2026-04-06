# auth-access - Changelog

## 2026-03-30 (KAN-61 cierre de feedback bloqueante PR #51)

- Se actualiza `kan-61-rbac-critical-use-cases-apply-evidence.md` con evidencia TDD verificable **RED -> GREEN -> REFACTOR** para riesgo `P1`, incluyendo comandos exactos, resultados y run refs locales trazables.
- Se documenta ejecución combinada de pruebas `unit/service` + `integration/API` para no-regresión en mutaciones RBAC de roles por usuario.
- Se registra `TddExceptionRecord` formal por bloqueo de Docker daemon local (`dockerDesktopLinuxEngine`), con `approval_ref`, controles compensatorios y vencimiento.

## 2026-03-27 (KAN-61 extraccion de casos de uso RBAC criticos)

- Se agrega `kan-61-rbac-critical-use-cases-apply-evidence.md` con trazabilidad de alcance, diseño aplicado y evidencia TDD de KAN-61.
- Se documenta extracción de mutaciones sensibles RBAC desde `rbac_views.py` hacia `use_cases/rbac_write/*` y `rbac_write_policy.py`.
- Se mantiene compatibilidad de contrato HTTP y auditoría, sin cambios de schema/migraciones.
- Se registra bloqueo operativo de validación Docker por error de daemon local (`dockerDesktopLinuxEngine`), con plan de validación en CI/entorno sano.

## 2026-03-27 (KAN-58A S2 mutaciones de roles)

- Se implementa extracción S2 para `POST /roles`, `PUT /roles/{id}` y `DELETE /roles/{id}` con policy/repository/use_cases/views dedicados.
- Se agrega feature flag `RBAC_ROLE_MUTATION_S2_ENABLED` para delegación híbrida y rollback inmediato.
- Se agrega evidencia `kan-58a-s2-apply-evidence.md` con trazabilidad TDD Red->Green->Refactor y validación Docker-first.
- Se actualiza discoverability en `docs/README.md` y `docs/domains/auth-access/README.md`.

## 2026-03-26 (cierre formal documental validado con cliente)

- Se agrega `cierre-formal-mvp-fase2.md` como documento canonico para alcance final MVP/Fase 2, reglas operativas, acciones sensibles, break-glass, trazabilidad, KPIs y DoR para implementacion.
- Se transforma `pending-decisions.md` en acta de cierre de decisiones historicamente pendientes (estado resuelto).
- Se actualiza `prd.md` para reflejar decisiones validadas por cliente y eliminar pendientes abiertos en ownership, alcance y controles operativos.
- Se actualizan `README.md` y `overview.md` del dominio para mejorar discoverability y onboarding junior.
- Se registra `AUTH-DEC-012` en `decision-log.md` para trazabilidad de la decision de cierre formal.

## 2026-03-26 (KAN-55 estrategia TDD-first por riesgo)

- Se resuelven marcadores de conflicto de merge en `boundary-map-acl.md`, `backlog-mapping.md`, `request-id-traceability-contract.md`, `decision-log.md` y `changelog.md` para recuperar baseline canónico de `auth-access`.
- Se agrega `tdd-risk-strategy-kan-55.md` con clasificación P0/P1/P2 por slice `S0..S6`, matriz mínima de cobertura y gate go/no-go por riesgo.
- Se agrega `tdd-evidence-templates.md` con plantillas obligatorias de evidencia Red->Green->Refactor para Jira/PR.
- Se agrega `tdd-exception-policy.md` con flujo formal de excepción, aprobación dual para alto impacto y seguimiento por vencimiento.
- Se actualizan `docs/guides/pr-merge-governance.md`, `docs/guides/domain-dor-dod.md` y `.github/pull_request_template.md` para enforcement operativo KAN-55.
- Se actualiza discoverability en `docs/domains/auth-access/README.md` y `docs/README.md`.

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
