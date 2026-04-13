# auth-access - Changelog

## 2026-04-13 (KAN-91 cierre orquestación DoD Módulo 1)

- Se agrega `kan-91-module-1-closure-acta.md` como fuente canónica docs/ops para cierre KAN-91 con matriz `dependencia -> evidencia -> estado` sobre KAN-86/KAN-89/KAN-92.
- Se aplica regla determinística compuesta de sign-off y se emite dictamen `NO-GO` por ausencia de dictamen final reproducible en KAN-89 (estado Jira `En revisión`).
- Se documenta bloqueo operativo con owner+ETA y transición objetivo de Jira KAN-91 a `Blocked` hasta completar evidencia mínima obligatoria.
- Se actualiza discoverability en `docs/domains/auth-access/README.md` y `docs/README.md`.

## 2026-04-13 (KAN-103 ajuste de trazabilidad Jira + gap analysis AC)

- Se corrige mapeo de subtareas Jira en artefactos KAN-103 para reflejar IDs reales: `S1=KAN-107`, `S2=KAN-106`, `S3=KAN-109`, `S4=KAN-105`, `S5=KAN-108`, `S6=KAN-104`.
- Se agrega `db-gap-analysis-prioritization.md` con priorización explícita `must/should/could` para cumplir AC de KAN-103.
- Se actualizan referencias cruzadas en `docs/README.md`, `docs/domains/auth-access/README.md`, `backlog-mapping.md`, `db-domain-to-be-map.md`, `db-domain-execution-plan-s1-s6.md` y `kan-103-go-no-go-checklist.md`.

## 2026-04-13 (KAN-103 Batch 3: cierre S5/S6 bootstrap + Go/No-Go)

- Se actualiza `local-db-bootstrap-strategy.md` para alinear estrategia de seeds/bootstrap al TO-BE de KAN-103, reforzando guardrail contractual (sin mutación de datos cross-domain no owner).
- Se agrega validación automatizada Docker-first en `Makefile` con targets `test-seed-auth-command` y `validate-auth-access-bootstrap`.
- Se amplía cobertura en `test_seed_auth_access_command.py` para verificar que seeds auth-access no alteran `cat_centros_atencion`.
- Se crea `kan-103-go-no-go-checklist.md` con criterios de salida S1..S6, evidencia requerida y clasificación bloqueante/no-bloqueante.
- Se actualiza `db-domain-execution-plan-s1-s6.md` con consolidación de cierre Batch 3 (S5/S6: KAN-108/KAN-104).

## 2026-04-13 (KAN-103 Batch 2: plan ejecutable S1..S6 + contratos cross-domain)

- Se agrega `db-domain-execution-plan-s1-s6.md` con matriz por subtarea S1..S6 (S1=KAN-107, S2=KAN-106, S3=KAN-109, S4=KAN-105, S5=KAN-108, S6=KAN-104), entregables, AC verificables, evidencia esperada y plan por fases `expand -> migrate -> contract`.
- Se agrega `db-cross-domain-contracts.md` con contratos permitidos para datos no owner de auth-access (incluyendo `cat_centros_atencion`), anti-patrones prohibidos y guía de transición `FK legacy -> contract reference`.
- Se consolida trazabilidad Jira↔Docs actualizando `README.md`, `decision-log.md` y `backlog-mapping.md` del dominio.
- Se actualiza discoverability en `docs/README.md` y `docs/domains/auth-access/README.md`.

## 2026-04-13 (KAN-103 Batch 1: DB-domain TO-BE + consistencia de estado)

- Se agrega `db-domain-to-be-map.md` como mapa TO-BE de ownership DB para Auth-Access con matriz AS-IS vs TO-BE, owner actual/objetivo, clasificación `keep/move/consume-by-contract/split`, riesgos y frontera cross-domain.
- Se alinea el estado del dominio Auth & Access en artefactos canónicos: `docs/architecture/domain-map.md` y `docs/guides/incremental-domain-migration.md` quedan consistentes en estado **hybrid**.
- Se actualiza discoverability en `docs/domains/auth-access/README.md` y `docs/README.md` con trazabilidad explícita KAN-103 y S1/S2 (KAN-107/KAN-106).

## 2026-04-08 (KAN-71 guía institucional demo multi-sprint)

- Se agrega `kan-71-multi-sprint-demo-process.md` con proceso reusable para demos Sprint 2+ (plantilla `Demo Sprint X`, checklist mínimo de evidencia y flujo de cierre Jira/PR/docs).
- Se incorpora aplicación de checklist a caso real Sprint 1 usando `kan-70-s1-document-closure-acta.md` y `kan-60-s1-qa-regression-go-no-go.md` como baseline de validación.
- Se actualiza discoverability en `docs/domains/auth-access/README.md` y `docs/README.md`.

## 2026-04-08 (KAN-60 regresión funcional + checklist pre-deploy)

- Se agrega `kan-60-s1-qa-regression-go-no-go.md` como acta canónica de ejecución QA para Sprint 1 (matriz AC, checklist PASS/FAIL, evidencia Docker-first y dictamen final).
- Se documenta y cierra hallazgo crítico de regresión en backend tests (`test_create_user_email_failure_rolls_back_creation`) endureciendo precondición con `@override_settings(ALLOW_USER_CREATE_WITHOUT_EMAIL=False)` y revalidación en verde (`155 tests / OK`).
- Se actualiza discoverability en `docs/domains/auth-access/README.md` y `docs/README.md`.

## 2026-04-07 (KAN-70 cierre final 100%: Jira Finalizada + gaps cerrados)

- Se crea `kan-59-apply-evidence.md` con evidencia TDD-first completa de KAN-59 (PRs #59/60/61, decisiones técnicas DEC-KAN-59-001 a DEC-KAN-59-004, ciclo RED→GREEN→REFACTOR, rollback baseline).
- Se actualiza `kan-70-s1-document-closure-acta.md` para cerrar G-002 (evidencia documental faltante) y reclasificar de `parcial` a `aceptado` (100% completeness, 3/3 AC validados).
- Se actualizan `changelog.md` y `decision-log.md` con registro de cierre final ACEPTADO + cierre operativo en Jira.
- Se publica comentario final en Jira KAN-70 (`commentId=11932`) con trazabilidad AC→evidencia.
- Se ejecuta transición de workflow Jira `In Dev -> Finalizada` (transition id `31`).
- Se cierran G-001/G-002/G-003 y se elimina riesgo residual operativo para KAN-70.
- Estado final: KAN-70 **ACEPTADO** (100% completeness) y **Finalizada** en Jira.

## 2026-04-07 (KAN-70 post-rebase: integración KAN-66/67/62)

- Se ejecutó rebase de `chore/kan-70-apply` sobre `main` para integrar KAN-66 (PR #64), KAN-67 (PR #63) y KAN-62 (PR #62).
- Se actualizó acta `kan-70-s1-document-closure-acta.md` para incluir KAN-66 en matriz AC→evidencia (AC-1).
- Se mantiene estado `parcial` mientras persistan G-001/G-002/G-003.

## 2026-04-07 (KAN-67 cutover incremental + retiro controlado legacy)

- Se retira lógica legacy inline del segmento S3 en `rbac_views.py` para `POST /permissions/assign` y `DELETE /permissions/roles/{roleId}/permissions/{permissionId}`.
- Se mantiene fallback controlado por `RBAC_ROLE_PERMISSION_S3_ENABLED` delegando a:
  - `rbac_role_permission_views.py` (source `s3`)
  - `rbac_role_permission_legacy_views.py` (source `legacy`)
- Se agrega cobertura de no-regresión para source de auditoría con flag deshabilitada:
  - `test_assign_role_permissions_records_legacy_source_when_flag_disabled`
  - `test_revoke_permission_records_legacy_source_when_flag_disabled`
- Se agrega `kan-67-cutover-legacy-retirement.md` y se actualiza discoverability en `docs/domains/auth-access/README.md` y `docs/README.md`.

## 2026-04-07 (KAN-66 hardening RBAC write concurrency + idempotency)

- Se integró hardening de escritura RBAC con controles de concurrencia e idempotencia (KAN-66, PR #64).
- Referencia: commit `fa6924f`.

## 2026-04-07 (KAN-62 hardening switch operativo read-only RBAC)

- Se agrega `kan-62-read-source-switch-hardening.md` con contrato operativo del nuevo switch `RBAC_READ_SLICE_SOURCE` (`legacy|s1|auto`).
- Se documenta precedencia oficial entre `RBAC_READ_SLICE_SOURCE` y `RBAC_READ_S1_ENABLED` con matriz de decisión explícita.
- Se agrega runbook de rollback inmediato a legacy (pasos + verificación de `meta.source="legacy"`).
- Se actualiza discoverability en `docs/domains/auth-access/README.md` y `docs/README.md`.

## 2026-04-07 (KAN-70 continuidad apply parcial)

- Se actualiza `kan-70-s1-document-closure-acta.md` para dejar explícito el estado de continuidad apply: KAN-70 permanece en `parcial` y no se declara aceptación final.
- Se agrega seguimiento explícito de fallback canónico (`F-001/F-002/F-003`) con owner, siguiente acción y ETA, marcado como deuda de governance **no bloqueante** para KAN-70.
- Se mantiene criterio de cierre sin cambios: KAN-70 pasa a `aceptado` solo al cerrar G-001/G-002/G-003 y revalidar checklist completo.

## 2026-04-07 (KAN-70 cierre documental operativo Sprint 1)

- Se crea `kan-70-evidence-matrix-template.md` con contrato `ActaACRow`, filas base AC-1/AC-2/AC-3 y arranque RED con `resultado=gap` por defecto.
- Se crea `kan-70-s1-document-closure-acta.md` como single-source de cierre evidence-first (matriz AC->evidencia, checklist operativo, reglas determinísticas de estado, gaps con owner/ETA y paquete PR).
- Se clasifica estado final KAN-70 como **parcial** por dependencia externa Jira MCP (sin acceso para publicar comentario final/validar URLs) y gap documental de KAN-59, ambos con control compensatorio.
- Se actualiza discoverability en `docs/domains/auth-access/README.md` y `docs/README.md`.
- Se documenta fallback canónico por ausencia de `hexagonal-clean-framework`, `solid-enforcement` y `pattern-catalog` en la rama actual.
## 2026-04-06 (migración estructural frontend domain-first auth-access - Lote 5 cleanup reintento validado)

- Se reejecuta barrido repo-wide de consumidores para paths legacy:
  - `@/features/auth/**`
  - `@/features/admin/modules/rbac/**`
  - resultado: **0 consumidores runtime/test** (solo referencias documentales históricas).
- Se verifica que `frontend/src/features/auth/**` y `frontend/src/features/admin/modules/rbac/**` no conservan wrappers activos.
- Se confirma canon de consumo en `frontend/src/domains/auth-access/**` para auth + RBAC.
- Validación Docker-first focalizada ejecutada:
  - `docker compose exec frontend bun run test:run src/test/unit/auth/useAuthCapabilities.test.tsx src/test/unit/router/ProtectedRoute.capabilities.test.tsx src/test/unit/auth/auth-mutations-sync.test.tsx src/test/integration/users/UsersPage.ui.test.tsx src/test/integration/roles/RolesPage.ui.test.tsx`
  - resultado: `5 files passed`, `42 tests passed`.

## 2026-04-06 (migración estructural frontend domain-first auth-access - Lote 5 cleanup final)

- Se ejecuta barrido repo-wide de consumidores legacy de wrappers en frontend.
- Se migran consumidores restantes de `@features/auth/**` y `@/features/auth/**` hacia imports domain-first `@/domains/auth-access/**` en runtime y tests impactados.
- Se eliminan wrappers `@deprecated` sin consumidores en:
  - `frontend/src/features/auth/**`
  - `frontend/src/features/admin/modules/rbac/**`
- Estado final explícito: **no quedan wrappers legacy activos** para auth/rbac en `frontend/src/features/**`; la implementación/canon queda en `frontend/src/domains/auth-access/**`.
- Se actualiza documentación de migración/changelog y referencias API para reflejar retiro de wrappers.

## 2026-04-06 (migración estructural frontend domain-first auth-access - Lote 4 RBAC restante)

- Se migra RBAC restante movible de `frontend/src/features/admin/modules/rbac/**` hacia `frontend/src/domains/auth-access/**`:
  - `components/admin/rbac/{users,roles,shared}`
  - `hooks/rbac/{users,roles,permissions}` (queries/mutations/keys)
  - `adapters/rbac/{users,roles,shared}`
  - `types/rbac/{users.schemas,roles.schemas}`
- Se actualizan consumidores (rutas, páginas domain-first y tests unit/integration RBAC) para usar imports `@/domains/auth-access/**`.
- Se mantienen wrappers `@deprecated` en `frontend/src/features/admin/modules/rbac/**` únicamente como compatibilidad transicional.
- Estado remanente explícito: no queda implementación RBAC activa en `features/admin/modules/rbac/**`; queda deuda de retiro de wrappers cuando no existan consumidores legacy.

## 2026-04-06 (migración estructural frontend domain-first auth-access - Lote 3)

- Se migra remanente auth UI `ParticlesBackground` desde `frontend/src/features/auth/animations/ParticlesBackground.tsx` hacia `frontend/src/domains/auth-access/components/shared/ParticlesBackground.tsx`.
- Se migra núcleo RBAC movible de KAN-65 a domain-first:
  - `frontend/src/features/admin/modules/rbac/users/pages/UsersPage.tsx` -> `frontend/src/domains/auth-access/pages/admin/users/UsersPage.tsx`
  - `frontend/src/features/admin/modules/rbac/roles/pages/RolesPage.tsx` -> `frontend/src/domains/auth-access/pages/admin/roles/RolesPage.tsx`
- Se actualizan consumidores a path domain-first en rutas/tests:
  - `frontend/src/app/router/modules/admin.routes.config.tsx`
  - `frontend/src/test/integration/users/UsersPage.ui.test.tsx`
  - `frontend/src/test/integration/roles/RolesPage.ui.test.tsx`
  - tests auth UI mockean `ParticlesBackground` desde `domains/auth-access`.
- Se mantienen wrappers `@deprecated` en paths legacy (`features/auth/animations` y `features/admin/modules/rbac/*/pages`) para compatibilidad incremental sin big-bang.

## 2026-04-06 (migración estructural frontend domain-first auth UI - Lote 2)

- Se migran páginas de auth UI a `frontend/src/domains/auth-access/pages`: `LoginPage.tsx`, `OnboardingPage.tsx`.
- Se migran componentes de auth UI a `frontend/src/domains/auth-access/components`:
  - `login/LoginForm.tsx`
  - `recovery/RequestCodeForm.tsx`, `recovery/VerifyOtpForm.tsx`
  - `onboarding/TermsStep.tsx`
  - `shared/AuthCard.tsx`, `shared/SessionObserver.tsx`
  - `shared/password/AuthPasswordForm.tsx`, `shared/password/PasswordRequirements.tsx`
- Se actualizan rutas e imports consumidores a path domain-first (`Routes.tsx`, `RootLayout.tsx`, tests de integración auth).
- Se mantienen wrappers `@deprecated` en `frontend/src/features/auth/pages/*` y `frontend/src/features/auth/components/**/*` para compatibilidad incremental.
- Remanente explícito post-Lote 2: `frontend/src/features/auth/animations/ParticlesBackground.tsx`.

## 2026-04-06 (migración estructural frontend domain-first auth-access)

- Se migra núcleo frontend de `auth-access` a `frontend/src/domains/auth-access` con estructura target por capa:
  - `hooks/`: `useAuthSession`, `usePermissions`, `usePermissionDependencies`, `useAuthCapabilities`, `useLogin`, `useLogout`, `useRefreshSession`, `hooks/rbac/users/useUsersList`.
  - `adapters/`: `auth-cache`, `auth-session-sync`, `auth-query-invalidation`, `session-events`, `rbac/capabilities-gating`.
  - `types/`: `auth.messages`, `auth.rules`, `auth.schemas`, `permission-dependencies`.
  - `state/`: `auth.keys`.
- Se actualizan imports críticos (guardas, interceptor API, páginas RBAC users/roles y tests focalizados auth/admin) para consumir rutas domain-first.
- Se reintroducen wrappers temporales `@deprecated` en `frontend/src/features/auth/**` y `frontend/src/features/admin/modules/rbac/**` para compatibilidad incremental sin big-bang.
- Se actualiza estado de migración de Auth & Access a `hybrid` en `docs/guides/incremental-domain-migration.md`.

## 2026-04-06 (KAN-65 Block E cierre documental + evidencia PR)

- Se agrega `kan-65-admin-capabilities-apply-evidence.md` con cierre de evidencia TDD-first por bloques A-D (RED/GREEN/REFACTOR), trazabilidad de AC `KAN-65-AC1..AC5`, riesgos y rollback.
- Se agrega `kan-65-pr-evidence-draft.md` con borrador evidence-first listo para descripción de PR (sin abrir PR en esta fase).
- Se actualiza `permissions-source-of-truth.md` con delta KAN-65 para dejar explícito el boundary: `/auth/capabilities` como source of truth UX admin y `/auth/me` para sesión/identidad.
- Se actualiza `docs/api/modules/auth.md` para reflejar uso operativo KAN-65 y fail-closed en estado error/degraded de capacidades.
- Se actualiza discoverability en `docs/domains/auth-access/README.md` y `docs/README.md`.

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
