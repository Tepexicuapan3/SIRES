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
