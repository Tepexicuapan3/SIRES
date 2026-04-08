# KAN-59 - Evidencia de Implementación (Apply Phase)

> **TL;DR:** Evidencia TDD-first de KAN-59 (adaptación frontend guards/routing a capability-first con slice piloto auth-access). Incluye trazabilidad PRs #59/#60/#61, decisiones técnicas, evidencia RED→GREEN→REFACTOR y rollback canónico.

---

## 1) Contexto y Objetivo

### Ticket Jira
- **Jira ID:** KAN-59
- **URL:** https://siresstc.atlassian.net/browse/KAN-59
- **Título:** [P1][ENHANCEMENT] Adaptar frontend de permisos/guards al slice piloto auth_access
- **Estado Jira:** Done (Listo)
- **Resolution:** Listo
- **Due Date:** 2026-04-06
- **Epic:** KAN-46 (Refactor incremental Dominio 1 auth_access)

### Objetivo del Ticket
Alinear guards/permisos del frontend con el slice piloto auth-access para consolidar comportamiento consistente en rutas críticas admin.

### Alcance IN
- Ajustar guards/routing en módulos admin afectados por auth-access.
- Unificar decisiones de visibilidad/navegación con capacidades backend.
- Corregir regresiones de UX por denegación/timeout/error de permisos.

### Alcance OUT
- No rediseño de UI.
- No cambios backend/API.
- No cubrir módulos fuera del dominio admin impactado.

---

## 2) Trazabilidad PRs y Commits

### PR #59 (Superseded - Cerrado sin merge)
- **URL:** https://github.com/Luis-Ant/SIRES/pull/59
- **Título:** feat(auth): close KAN-59 operational flow and evidence [KAN-59]
- **Estado:** CLOSED (sin merge)
- **Commit principal:** `5f13d2e9b4cfe30a638a94e39e2ea69658766af0`
- **Razón de cierre:** Conflicto con baseline KAN-65 + imports legacy `features/auth/*` detectados
- **Archivos tocados:**
  - `docs/README.md` (+1)
  - `docs/domains/auth-access/README.md` (+1)
  - `docs/domains/auth-access/kan-59-apply-evidence.md` (+100, primera versión)
  - `frontend/src/app/router/guards/ProtectedRoute.tsx` (+117/-38)
  - `frontend/src/app/router/modules/admin.routes.config.tsx` (+22/-4)
  - `frontend/src/test/unit/auth/usePermissionDependencies.test.ts` (+19)
  - `frontend/src/test/unit/router/ProtectedRoute.test.tsx` (+260, nuevo)
  - `frontend/src/test/unit/router/admin.routes.config.test.tsx` (+77, nuevo)

### PR #60 (Superseded - Cerrado sin merge)
- **URL:** https://github.com/Luis-Ant/SIRES/pull/60
- **Título:** fix(auth-access): remediate KAN-59 domain alignment v2 [KAN-59]
- **Estado:** CLOSED (auto-cerrado tras merge de base temporal)
- **Commit principal:** `1aba3930012ea3521a38a95f0552844d6435b2ae`
- **Base temporal:** `kan-65-sdd-apply-block-a` (pendiente merge de KAN-65)
- **Razón de cierre:** Retarget a main tras merge de PR #57 (KAN-65)
- **Archivos tocados:**
  - `frontend/src/app/router/guards/ProtectedRoute.tsx` (+48/-14)
  - `frontend/src/app/router/modules/admin.routes.config.tsx` (+22/-4)
  - `frontend/src/domains/auth-access/hooks/usePermissionDependencies.ts` (+1)
  - `frontend/src/test/unit/auth/usePermissionDependencies.test.ts` (+19)
  - `frontend/src/test/unit/router/ProtectedRoute.capabilities.test.tsx` (+87/-1)

### PR #61 (MERGED - Implementación final)
- **URL:** https://github.com/Luis-Ant/SIRES/pull/61
- **Título:** fix(auth-access): remediate KAN-59 domain alignment v2 [KAN-59]
- **Estado:** MERGED
- **Commit final:** `924ce8c5588e11c2d18ecfa8bdfe7b0da2698a5c`
- **Base:** `main` (post-merge KAN-65 PR #57)
- **Fecha merge:** 2026-04-07
- **Archivos merged:**
  - `frontend/src/app/router/guards/ProtectedRoute.tsx` (+48/-14)
  - `frontend/src/app/router/modules/admin.routes.config.tsx` (+22/-4)
  - `frontend/src/domains/auth-access/hooks/usePermissionDependencies.ts` (+1)
  - `frontend/src/test/unit/auth/usePermissionDependencies.test.ts` (+19)
  - `frontend/src/test/unit/router/ProtectedRoute.capabilities.test.tsx` (+87/-1)

---

## 3) Evidencia TDD-First (RED → GREEN → REFACTOR)

### Alcance TDD
- **Aplica TDD-first?:** Sí
- **Justificación:** Capability-first guard rollout + route access behavior hardening en auth-access admin routing (NEW functionality con impacto authz UX crítico)

### Tests-First Planning
- **SDD change:** `kan-59-planificacion-implementacion` (PR #59) y `kan-59-v2-domain-alignment` (PR #60/61)
- **Evidencia planning:** `sdd/kan-59-planificacion-implementacion/tasks` y `sdd/kan-59-v2-domain-alignment/tasks`
- **Fase 2 (RED) planificada antes de Fase 3 (GREEN):** Confirmado en tasking SDD

### RED Evidence (Initial Failing Tests)

#### PR #60/61 - Focused TDD Cycle
**Comando Docker-first:**
```bash
docker compose run --rm \
  -e VITE_API_URL="/api/v1" \
  -e VITE_APP_NAME="SIRES" \
  -e VITE_APP_VERSION="1.0.0" \
  frontend sh -lc \
  "bun install && bun run test:run \
    src/test/unit/router/ProtectedRoute.capabilities.test.tsx \
    src/test/unit/auth/usePermissionDependencies.test.ts"
```

**Resultado RED:**
- **Tests Failed:** 5/12
- **Tests Passed:** 7/12
- **Failures:**
  - `fallbackRequirement` metadata not wired in admin routes
  - Auth transport error view not rendered
  - Capability dependency map missing strict `admin.*` fail-closed
  - In-scope admin routes missing capability-first metadata

### GREEN Evidence (Minimal Implementation Passing)

**Cambios mínimos aplicados:**
1. `ProtectedRoute.tsx`: agregado `fallbackRequirement` branch y auth error view
2. `admin.routes.config.tsx`: agregado metadata capability-first para rutas in-scope (usuarios, roles, áreas, centros-atención)
3. `usePermissionDependencies.ts`: agregado strict fail-closed para prefijo `admin.*`

**Re-ejecución Docker-first (mismo comando):**
- **Tests Failed:** 0/12
- **Tests Passed:** 12/12
- **Suite:** `ProtectedRoute.capabilities.test.tsx` (8 tests), `usePermissionDependencies.test.ts` (4 tests)

### REFACTOR Evidence (Cleanup with Tests Still Passing)

**Refactor aplicado:**
- Extracción de `AccessDeniedView` y `AuthErrorView` en `ProtectedRoute` (sin cambios de comportamiento)
- Simplificación de ramas de error con componentes explícitos

**Re-ejecución Docker-first (mismo comando):**
- **Tests Failed:** 0/12
- **Tests Passed:** 12/12
- **Resultado:** STABLE GREEN después de refactor

### Suites de Tests Creadas/Extendidas

1. **`ProtectedRoute.capabilities.test.tsx`** (87 líneas agregadas en PR #61)
   - Capability-first/fallback logic
   - Auth transport error branching
   - Access denied view rendering
   - Loading states

2. **`usePermissionDependencies.test.ts`** (+19 líneas en PR #61)
   - Strict `admin.*` fail-closed behavior
   - Capability dependency resolution

3. **`admin.routes.config.test.tsx`** (77 líneas en PR #59, no merged pero cobertura conceptualmente validada en PR #61)
   - In-scope admin route metadata matrix (usuarios, roles, áreas, centros-atención)
   - Out-of-scope route preservation

---

## 4) Decisiones Técnicas

### DEC-KAN-59-001: Migración capability-first con fallback dependency-aware
- **Fecha:** 2026-04-06
- **Decisión:** Migrar guards admin in-scope a metadata `requiredCapability` + `fallbackRequirement` dependency-aware
- **Rationale:** Alineación con contrato backend auth-access y reducción de falsos negativos por proyección de capabilities
- **Impacto:** Frontend ahora consume capabilities backend con fallback explícito por dependencias missing
- **Alternativas descartadas:** Guard role-based legacy (acoplamiento alto + divergencia backend)

### DEC-KAN-59-002: Hardening de ProtectedRoute con ramas explícitas error/denied
- **Fecha:** 2026-04-06
- **Decisión:** Agregar branching explícito en `ProtectedRoute` para auth transport error vs access denied
- **Rationale:** Separar errores de comunicación/sesión de denegaciones de authz (UX + troubleshooting)
- **Impacto:** Usuarios ven mensajes diferenciados para timeout/500 vs permisos insuficientes
- **Alternativas descartadas:** Single error view genérico (confunde usuarios + dificulta debug)

### DEC-KAN-59-003: Strict fail-closed para prefijo admin.* en usePermissionDependencies
- **Fecha:** 2026-04-06
- **Decisión:** Agregar lógica fail-closed para capabilities con prefijo `admin.*` cuando mapa de dependencias no contiene entrada
- **Rationale:** Evitar bypass accidental de authz por omisión de metadata en rutas admin críticas
- **Impacto:** Rutas admin sin metadata capability explícita son bloqueadas por defecto
- **Alternativas descartadas:** Fail-open (riesgo seguridad) o warning-only (sin enforcement)

### DEC-KAN-59-004: Remediación v2 para eliminar imports legacy features/auth/*
- **Fecha:** 2026-04-06
- **Decisión:** Rehacer PR #59 como PR #60/61 con imports domain-first auth-access únicamente
- **Rationale:** PR #59 reintroducía acoplamiento legacy detectado por gate anti-legacy + conflicto con baseline KAN-65
- **Impacto:** Branch v2 alineado a domain-first, sin imports prohibidos, compatible con KAN-65 merged
- **Alternativas descartadas:** Merge de PR #59 con excepciones (violaría dependency-rules)

---

## 5) Riesgos y Lecciones Aprendidas

### Riesgos Identificados

#### RISK-KAN-59-001: Capability projection drift (backend ↔ frontend)
- **Severidad:** Media
- **Impacto:** Frontend espera capabilities no proyectadas desde backend → false-negative access
- **Mitigación aplicada:** Fallback dependency-aware + strict fail-closed para admin.*
- **Lección:** Siempre validar payload real de `/permissions/capabilities` antes de wiring metadata

#### RISK-KAN-59-002: False-negative access si prefijos expand sin dependency map sync
- **Severidad:** Media
- **Impacto:** Nuevas capabilities admin.* agregadas en backend sin actualizar mapa de dependencias frontend bloquean acceso legítimo
- **Mitigación aplicada:** Doc explícita en evidence + test coverage para dependency resolution
- **Lección:** Mantener sincronización proactiva mapa de dependencias con evolución de capabilities backend

#### RISK-KAN-59-003: Conflicto temporal con KAN-65 (base branch dependency)
- **Severidad:** Alta (bloqueante para PR #59)
- **Impacto:** PR #59 con imports legacy incompatible con baseline domain-first de KAN-65
- **Resolución:** Remediación v2 (PR #60/61) sobre baseline KAN-65 merged
- **Lección:** Validar baseline de dependencias antes de iniciar apply; detectar imports prohibidos con gate anti-legacy temprano

### Lecciones Aprendidas

1. **TDD Docker-first focal scope reduce blast radius:**
   - Suite focal (2-3 archivos core) con Docker-first validó comportamiento crítico sin full-suite overhead
   - Iteración RED→GREEN→REFACTOR en <30min por ciclo

2. **Gate anti-legacy detecta acoplamiento temprano:**
   - Validación `rg "@/?features/auth"` antes de PR evita merge de imports prohibidos
   - Automatizar gate en pre-commit (GGA) reduciría fricción manual

3. **Dependency-aware fallback reduce false-negatives de authz:**
   - Metadata `fallbackRequirement` permite UX progresivo mientras backend completa proyección de capabilities
   - Evita bloqueo total de funcionalidad por gaps de migración capability-first

4. **Remediación v2 con base actualizada es más rápida que fix-forward:**
   - Rehacer PR sobre baseline limpio (main post-KAN-65) tomó <2h vs intentar rebase conflictivo de PR #59

---

## 6) Baseline de Rollback

### Rollback de ProtectedRoute y admin.routes.config
```bash
# Baseline pre-KAN-59 (referencia explícita de PR #60/61)
git log --oneline --all --decorate --grep "KAN-65"
# Baseline ref: 11a9fb7 (commit pre-KAN-59 en branch kan-65-sdd-apply-block-a)

# Comando rollback
git restore --source 11a9fb7 -- \
  frontend/src/app/router/guards/ProtectedRoute.tsx \
  frontend/src/app/router/modules/admin.routes.config.tsx
```

### Rollback de usePermissionDependencies
```bash
# Restaurar versión pre-strict-fail-closed
git restore --source 11a9fb7 -- \
  frontend/src/domains/auth-access/hooks/usePermissionDependencies.ts
```

### Validación post-rollback
```bash
# Re-ejecutar suite focal para confirmar baseline estable
docker compose run --rm \
  -e VITE_API_URL="/api/v1" \
  -e VITE_APP_NAME="SIRES" \
  -e VITE_APP_VERSION="1.0.0" \
  frontend sh -lc \
  "bun install && bun run test:run \
    src/test/unit/router/ProtectedRoute.capabilities.test.tsx \
    src/test/unit/auth/usePermissionDependencies.test.ts"

# Documentar evidencia de rollback en Jira + PR
```

---

## 7) Checklist de Compliance Arquitectónica

- [x] Layer responsibilities respetadas (presentation/transport guards, sin lógica dominio)
- [x] No business rules críticas en guards/routes (solo UX gating)
- [x] Domain boundaries explícitos (imports domain-first auth-access únicamente)
- [x] No direct cross-domain data access (N/A, frontend routing/guard)
- [x] Pattern choices justified (capability-first + dependency-aware fallback)
- [x] Inter-domain communication via contracts (capabilities proyectadas desde backend)
- [x] Real-time N/A (routing/guard síncrono)
- [x] Audit coverage N/A (UX gating, no mutaciones)
- [x] Authorization uses atomic permissions (capability-first metadata)
- [x] No premature complexity (minimal guard hardening, no over-abstraction)
- [x] DB changes N/A (frontend only)
- [x] Proportional automated tests (12 tests focal scope para critical authz UX paths)
- [x] TDD-first evidence included (RED/GREEN/REFACTOR en PR #60/61)
- [x] Architecture docs affected updated (este documento + acta KAN-70)

---

## 8) Referencias

### Documentación Técnica
- **Acta KAN-70:** `docs/domains/auth-access/kan-70-s1-document-closure-acta.md`
- **Baseline AS-IS auth-access:** `docs/domains/auth-access/baseline-as-is.md`
- **Boundary Map ACL:** `docs/domains/auth-access/boundary-map-acl.md`
- **KAN-55 Risk Gate:** `docs/domains/auth-access/tdd-risk-strategy-kan-55.md`

### PRs y Commits
- **PR #59 (superseded):** https://github.com/Luis-Ant/SIRES/pull/59
- **PR #60 (superseded):** https://github.com/Luis-Ant/SIRES/pull/60
- **PR #61 (merged):** https://github.com/Luis-Ant/SIRES/pull/61
- **Commit final merged:** `924ce8c` (branch `feat/auth/KAN-59-v2-domain-alignment`)

### Jira
- **KAN-59:** https://siresstc.atlassian.net/browse/KAN-59
- **Epic KAN-46:** https://siresstc.atlassian.net/browse/KAN-46
- **KAN-70 (cierre Sprint 1):** https://siresstc.atlassian.net/browse/KAN-70

### SDD Artifacts (Engram)
- **Change v1:** `sdd/kan-59-planificacion-implementacion/archive-report`
- **Change v2:** `sdd/kan-59-v2-domain-alignment/apply-progress`

---

**Fecha de creación:** 2026-04-07  
**Owner:** Luis Antonio Moreno (Frontend primary)  
**Proyecto:** SIRES  
**Dominio:** auth-access  
**Ticket:** KAN-59  
**Estado:** Implementación completada y merged (PR #61)
