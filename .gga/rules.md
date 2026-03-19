# SIRES GGA Repository Rules

## Goal

Review every commit with the SIRES operating model:

- domain-first delivery,
- DB por dominio with PostgreSQL as target,
- Jira + SDD + Engram traceability.

## Review Scope

Use these references as source of truth:

- `AGENTS.md`
- `docs/architecture/dependency-rules.md`
- `docs/architecture/db-ownership-migration-policy.md`
- `docs/guides/pr-merge-governance.md`
- `docs/templates/rfc-cross-domain-template.md`

## Blockers (must fail commit)

1. Domain boundary violations
   - New code introduces prohibited cross-domain coupling.
   - New dependency creates circular domain coupling.
2. DB ownership violations
   - Cross-domain direct SQL/table/schema access from application code.
   - DB changes without clear domain ownership.
   - DB strategy moves away from PostgreSQL target without explicit approved rationale.
3. Contract and error-policy violations
   - Cross-domain integration bypasses contracts (API, events, approved read-models).
   - New API integration ignores existing error contract expectations or introduces inconsistent error behavior without migration plan.
4. Traceability gaps when required
   - Architecture-impacting or cross-domain changes without matching RFC/ADR/doc update.
   - Changes that require operational decision records but no evidence of intended Engram capture path (`SIRES_SHARED` + topic key convention).

## Warnings (allow commit, request follow-up)

- Missing clarifications that do not break constraints immediately.
- Incomplete docs polish when operational constraints are still respected.

## Review Output Contract

For each finding include:

- `severity`: `blocker` or `warning`
- `rule`: short rule name
- `evidence`: file path(s) and concise explanation
- `fix`: actionable remediation with the minimal change needed

If no blockers exist, explicitly state that commit is aligned with:

- domain boundaries,
- DB por dominio policy,
- contract/error policy,
- traceability baseline.
