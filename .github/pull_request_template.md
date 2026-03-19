## What and Why

- What changed:
- Why this change is needed:

## Domain Impact

- Primary domain:
- Domain status: `legacy` | `hybrid` | `domain-first`
- Additional domains impacted (if any):

## Data Impact (required if DB/schema/query changes)

- Data owner domain:
- PostgreSQL target impact (`expand` | `migrate` | `contract` | `N/A`):
- Cross-domain SQL access introduced?: `no` (required) / explain exception:
- Overload controls reviewed (partitioning, indexes, retention/archive, read-models, observability):
- Criteria logical -> physical isolation evaluated?:

## Jira and SDD Traceability

- Jira ticket:
- Epic:
- SDD change (if applies):
- SDD phase status (`proposal/spec/design/tasks/apply/verify`):
- RFC cross-domain (required if multi-domain):
- Engram evidence (topic_key or note):

## Checklist

- [ ] Scope is focused and single-purpose
- [ ] Jira + SDD traceability completed
- [ ] Security guardrails reviewed (JWT HttpOnly + CSRF in mutating flows)
- [ ] Dependency rules respected (`docs/architecture/dependency-rules.md`)
- [ ] Data ownership respected (`DB por dominio`) and PostgreSQL target considered
- [ ] No direct cross-domain table/schema access from application code
- [ ] Data migration/rollback plan documented for high-risk changes
- [ ] Docs updated if behavior or operation changed
- [ ] Engram high-signal decisions/fixes saved to `SIRES_SHARED`
- [ ] Tests/evidence attached (or N/A explained)

## Risks and Rollback

- Main risks:
- Rollback plan:
