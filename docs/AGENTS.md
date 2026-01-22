# AGENTS.md - SIRES Documentation Ruleset

## How to Use This Guide

- Applies only to changes inside `docs/`.
- If it conflicts with the root `AGENTS.md`, this guide wins.

## Critical Rules - Non-negotiable

- Only document information that cannot be inferred from code.
- Keep docs under 500 lines; split if longer.
- Avoid duplicating content across files.
- Use existing templates in `docs/templates/`.
- Always link new docs from `docs/README.md`.

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
