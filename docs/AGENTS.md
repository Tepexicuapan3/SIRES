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
