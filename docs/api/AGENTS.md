# AGENTS.md - API Docs Contract Guide

## Scope

- Applies to `docs/api/**`.
- If it conflicts with `docs/AGENTS.md`, this file wins.

## Skills Reference

- `api-design-principles` - REST resource design, versioning, and consistency.
- `error-handling-patterns` - error payload standards, retries, fallback notes.
- `brainstorming` - planning API documentation structure before writing.
- `find-skills` - discover/install skills when requested.

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Define/review endpoint contracts | `api-design-principles` |
| Define/review error schema documentation | `error-handling-patterns` |
| User asks for planning/discovery before documentation | `brainstorming` |
| User asks to discover/install skills | `find-skills` |

## API Docs Rules

- Keep endpoint definitions aligned with backend implementation under `backend/apps/**`.
- Document method, path, auth requirements, request schema, response schema, and status codes.
- Document CSRF requirement for mutating requests (`X-CSRF-TOKEN`).
- Keep error payload shape consistent (`code`, `message`, `status`, optional `details`, optional `requestId`).
- Prefer concrete request/response examples over generic prose.
- For each module doc, include where business rules are expected to live (`application/domain`) vs transport (`presentation`).
- Explicitly call out anti-patterns when relevant (e.g., business rules in serializers/views).
- For cross-domain endpoints, document which communication mechanism is used (contract/orchestrator/event) and why.
- For realtime endpoints/channels, document business justification and standardized channel/auth/message contract.
- For auditable operations, include required audit fields and where `contextId/requestId` originates.
- For authorization, document atomic permissions required per endpoint; roles can be listed only as convenience bundles.

## QA Checklist

- [ ] Contract matches current backend behavior.
- [ ] Status codes and error shapes are explicit.
- [ ] Auth/CSRF requirements are explicit.
- [ ] Example payloads are copy/paste ready.
- [ ] Cross-domain communication mode is explicit and justified.
- [ ] Realtime contract (if any) is documented with channel/auth/message details.
- [ ] Audit requirements are documented for sensitive/critical operations.
- [ ] Endpoint permissions are atomic (no role-string-only security contract).

## Part 3 Hooks (Operational)

- Keep reconciled DB wording in API docs: single operational PostgreSQL source now with strict domain ownership/logical isolation; physical separation later by documented criteria.
- For write/critical endpoints, document data integrity expectations and explicit transaction/concurrency strategy at contract level when relevant.
- Keep collaboration standards explicit: contract changes that affect boundaries or critical behavior must update linked architecture/DoD docs in the same PR.
- Require risk-based test notes for critical endpoints (auth/authz, auditability, critical state transitions, concurrency-sensitive operations).
- Call out top risks: cross-domain coupling hidden behind endpoints, undocumented concurrency behavior, and hype-driven contract redesign.

## Part 3 Checklist

- [ ] DB policy wording matches staged PostgreSQL baseline.
- [ ] Critical endpoints document integrity + transaction/concurrency expectations.
- [ ] Related governance docs/DoD references updated with contract changes.
- [ ] Test expectations are proportional to endpoint risk.
- [ ] Reviewer notes include key risks to avoid for this contract.
