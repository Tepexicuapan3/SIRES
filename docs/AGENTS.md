# AGENTS.md - SIRES Documentation Ruleset

## Scope

- Applies only to changes inside `docs/`.
- If it conflicts with the root `AGENTS.md`, this guide wins.

## Load Narrow Context

- `docs/api/AGENTS.md` - API docs contract conventions.

## Skills Reference

- `api-design-principles` - document REST contracts and versioning.
- `error-handling-patterns` - document error contracts and fallback behavior.
- `brainstorming` - plan doc structure for complex topics.
- `find-skills` - discover/install skills when requested.

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Document/review API contracts and standards | `api-design-principles` |
| Document/review error contracts and resilience behavior | `error-handling-patterns` |
| User asks for planning/discovery before writing docs | `brainstorming` |
| User asks to discover/install skills | `find-skills` |

## Critical Rules - Non-negotiable

- Only document information that cannot be inferred from code.
- Keep docs under 500 lines; split if longer.
- Avoid duplicating content across files.
- Use existing templates in `docs/templates/`.
- Always link new docs from `docs/README.md`.
- Domain governance docs are mandatory references for cross-domain changes.

## Required Coverage for Architecture Standards (Part 1-15)

- Every architecture-facing update must keep these points explicit and actionable:
  - Modular monolith + pragmatic lightweight DDD.
  - Layered responsibilities (`presentation`, `application`, `domain`, `infrastructure`).
  - Folder conventions by business domain for backend and frontend.
  - Pattern usage guidance (use-cases, repositories, events, policies, transactions).
  - Inter-domain communication mechanisms and anti-coupling rules.
  - Real-time communication as controlled exception with dedicated module/contracts.
  - Audit scope + minimum event contract + DoD verification requirement.
  - Atomic permissions + centralized authorization + backend as source of truth.
  - DB strategy with staged policy (shared PostgreSQL instance now + strict domain ownership/logical isolation; physical split later by criteria).
  - Data integrity and safety controls (constraints, nullability, indexes, transaction boundaries, concurrency guidance).
  - Team collaboration standards (live architecture docs, domain ownership model, unified DoD, architecture review gates).
  - Risk-based testing strategy and mandatory coverage for critical features.
  - Strict TDD-first governance for new features/new functionality/large refactors (tests-first planning + Red/Green/Refactor + PR evidence + exception policy).
  - Stage-based system evolution guidance and ban on hype-driven architecture changes.
  - Canonical decision synthesis + system blueprint + anti-risk checklist + final operational recommendation.
- Include anti-pattern bans in docs when introducing new examples.
- Prefer "when to use / when not to use" sections over generic pattern descriptions.
- Include checklists when a document impacts implementation behavior.

## Part 2 Documentation Checklist (Mandatory)

- [ ] Inter-domain section states allowed mechanisms: contract, orchestrator use case, domain events.
- [ ] Anti-coupling bans are explicit (no internal model/repository/table coupling across domains).
- [ ] Real-time section distinguishes recommended vs non-recommended scenarios.
- [ ] Real-time docs require dedicated module + standardized channel/auth/message contracts.
- [ ] Audit section includes mandatory scope and minimum event fields.
- [ ] Audit storage constraints are documented (append-only, restricted access, masking/redaction).
- [ ] Permissions section enforces atomic permissions and centralized policy service.
- [ ] Docs explicitly state backend authorization as source of truth.

## Part 3 Documentation Checklist (Mandatory)

- [ ] DB policy explicitly states staged baseline: single PostgreSQL engine/instance now with strict domain ownership/logical boundaries; physical separation evaluated later.
- [ ] DB docs include integrity controls (PK/FK/unique/nullability/index strategy) and explicit transaction boundary guidance.
- [ ] Concurrency controls are documented for high-risk flows (locking/versioning/idempotency/serialization patterns).
- [ ] Docs distinguish operational transactional data from append-only audit/history responsibilities.
- [ ] Collaboration standards define live-doc update rule, domain primary/secondary ownership, and single DoD baseline.
- [ ] PR governance docs include architecture compliance gates (not only style/lint) and critical testing expectations.
- [ ] Testing docs include risk-based pyramid and priority coverage areas (security/authz/audit/critical flows/state transitions/concurrency).
- [ ] TDD-first governance is explicit for NEW feature/NEW functionality/LARGE refactor scope.
- [ ] Planning guidance requires tests-first tasking before implementation tasks.
- [ ] PR governance requires test-first evidence (initial failing tests, implementation progression, final passing state).
- [ ] TDD exception process requires explicit rationale + compensating controls/tests + approval.
- [ ] Evolution docs define stage-based path and ban hype/preference-driven architecture changes.
- [ ] Docs include concise canonical synthesis + system blueprint + reviewer anti-risk checklist + final recommendation.

## Domain-First Docs (Phase 1 + base Phase 2)

When documenting domain work, keep these artifacts aligned:

- `docs/architecture/domain-map.md`
- `docs/architecture/context-map.md`
- `docs/architecture/dependency-rules.md`
- `docs/architecture/db-ownership-migration-policy.md`
- `docs/architecture/repo-navigation-map.md`
- `docs/guides/pr-merge-governance.md`
- `docs/guides/domain-dor-dod.md`
- `docs/guides/incremental-domain-migration.md`
- `docs/templates/rfc-cross-domain-template.md`

## Protocolo de reducción de incertidumbre documental (obligatorio en `docs/`)

Toda propuesta o actualización documental debe justificar decisiones contra fuentes canónicas. No se permite escribir docs “por intuición”.

### A) Mapa canónico de documentación (path + uso + trigger)

| Ruta | Para qué sirve | Cuándo consultarlo (trigger) |
| --- | --- | --- |
| `docs/architecture/hexagonal-clean-framework.md` | Criterios de separación de capas y límites Hexagonal/Clean | Diseñar/refactorizar arquitectura o definir ownership de lógica |
| `docs/governance/solid-enforcement.md` | Enforcement operativo de SOLID | Revisar acoplamiento/cohesión y extracción de responsabilidades |
| `docs/architecture/pattern-catalog.md` | Selección de patrones y anti-patrones | Decidir use cases, repositorios, eventos, policies, transacciones |
| `docs/architecture/backend-structure-reference.md` | Blueprint backend por dominio/capa | Redactar guías de implementación backend o migración estructural |
| `docs/architecture/frontend-structure-reference.md` | Blueprint frontend por dominio/capa | Redactar guías de implementación frontend o migración estructural |
| `docs/domains/auth-access/*` | Contrato y verdad de auth/access | Cambios de authn/authz, permisos, RBAC, boundaries |
| `docs/api/*` | Estándares y contratos API | Cambios de endpoints, payloads, errores, versionado |
| `docs/governance/*` | Políticas de riesgo/compliance/calidad | Excepciones, criterios de aceptación, controles obligatorios |
| `docs/runbooks/*` | Procedimientos operativos y troubleshooting | Ejecución repetible, handoff, incidentes, operación diaria |

> Si falta alguna ruta esperada, usar fallback: `docs/architecture/overview.md`, `docs/architecture/dependency-rules.md`, `docs/architecture/repo-navigation-map.md`, `docs/guides/pr-merge-governance.md`, `docs/guides/domain-dor-dod.md`, y dejar el gap explicitado en PR.

### B) Playbooks por tipo de solicitud

- **Diseño de arquitectura**
  1. `docs/architecture/hexagonal-clean-framework.md`
  2. `docs/governance/solid-enforcement.md`
  3. `docs/architecture/pattern-catalog.md`
  4. `docs/architecture/context-map.md` + `docs/architecture/dependency-rules.md`
- **Implementación backend (documentación de soporte)**
  1. `docs/architecture/backend-structure-reference.md`
  2. `docs/architecture/hexagonal-clean-framework.md`
  3. `docs/architecture/pattern-catalog.md`
  4. `docs/api/*` + `docs/domains/<dominio>/*`
- **Implementación frontend (documentación de soporte)**
  1. `docs/architecture/frontend-structure-reference.md`
  2. `docs/architecture/hexagonal-clean-framework.md`
  3. `docs/architecture/pattern-catalog.md`
  4. `docs/api/*` + `docs/domains/<dominio>/*`
- **Cambios de API/contratos**
  1. `docs/api/standards.md`
  2. `docs/api/modules/*.md` afectados
  3. `docs/architecture/dependency-rules.md`
  4. `docs/domains/<dominio>/*`
- **Decisiones/riesgos/excepciones**
  1. `docs/governance/*`
  2. `docs/guides/pr-merge-governance.md`
  3. `docs/guides/domain-dor-dod.md`
  4. `docs/templates/rfc-cross-domain-template.md` (si hay impacto cross-domain)
- **Migración/refactor de dominio**
  1. `docs/architecture/domain-map.md`
  2. `docs/architecture/db-ownership-migration-policy.md`
  3. `docs/guides/incremental-domain-migration.md`
  4. `docs/domains/<dominio>/*`

### C) Orden de lectura recomendado

- **Fast path (obligatorio):**
  1. `docs/README.md`
  2. `docs/architecture/overview.md`
  3. Documento focal (`docs/api/*` o `docs/domains/<dominio>/*`)
  4. `docs/architecture/dependency-rules.md`
- **Deep path (alto impacto/ambigüedad/cross-domain):**
  1. Fast path completo
  2. `docs/architecture/hexagonal-clean-framework.md`
  3. `docs/governance/solid-enforcement.md`
  4. `docs/architecture/pattern-catalog.md`
  5. `docs/architecture/backend-structure-reference.md` o `docs/architecture/frontend-structure-reference.md`
  6. `docs/governance/*` + `docs/runbooks/*`
  7. `docs/templates/rfc-cross-domain-template.md` si aplica

### D) Reglas de precedencia documental (si docs se contradicen)

Precedencia obligatoria dentro de `docs/`:

1. `AGENTS.md` aplicable al subtree (este archivo para `docs/`).
2. Governance/compliance (`docs/governance/*`, `docs/guides/pr-merge-governance.md`).
3. Contratos (`docs/api/standards.md` + módulo).
4. Documentación de dominio (`docs/domains/<dominio>/*`).
5. Referencias de arquitectura/estructura (`docs/architecture/*`).
6. Runbooks y guías operativas (`docs/runbooks/*`, `docs/getting-started/*`).

Si el conflicto persiste: aplicar criterio más restrictivo para seguridad/auditoría y documentar resolución en PR + RFC corto si corresponde.

### E) Checklist obligatorio antes de proponer cambios

- [ ] Clasifiqué el tipo de solicitud (arquitectura/backend/frontend/API/riesgo/migración).
- [ ] Ejecuté fast path completo.
- [ ] Ejecuté deep path si corresponde.
- [ ] Verifiqué Hexagonal/Clean + SOLID + pattern-catalog para el caso.
- [ ] Validé contratos de dominio/API afectados.
- [ ] Dejé explícitos supuestos, restricciones y fuentes consultadas.

### F) Checklist obligatorio antes de cerrar/PR

- [ ] PR incluye sección **Evidencia documental** con rutas consultadas.
- [ ] Cada ruta documentada indica decisión tomada e impacto.
- [ ] Si hubo contradicción, se documentó precedencia y resolución.
- [ ] Si faltó doc canónico esperado, se consignó gap + fallback.
- [ ] Se actualizaron índices (`docs/README.md`) si se agregó/movió documentación.
- [ ] No se introdujo contenido fuera de alcance ni duplicación evitable.

---

## Decision Trees

### Where to Document
```
Architecture decision -> docs/adr/
Implementation guide -> docs/guides/
System overview -> docs/architecture/
API contracts -> docs/api/
Setup/troubleshooting -> docs/getting-started/
```

---

## Documentation Structure

Use this structure unless a template exists:

```
# Title

> TL;DR

## Problem / Context
## Solution / Implementation
## Examples
## References
```

---

## Workflow

- Use the templates in `docs/templates/` as the starting point.
- Create docs manually or ask the AI to generate content using the templates.
- Always update `docs/README.md` with new links.

---

## QA Checklist

- [ ] Doc fits the correct category
- [ ] Under 500 lines
- [ ] Includes copy/paste examples
- [ ] Linked in `docs/README.md`
- [ ] No duplicated content
