# SIRES Docs

Indice canonico de documentacion para operar SIRES con el modelo actual: monolito modular evolutivo, trabajo por dominios y flujo Jira + SDD-Orchestrator + Engram + GGA.

## Start Here

1. `docs/getting-started/setup.md`
2. `docs/getting-started/ai-team-workflow.md`
3. `docs/getting-started/onboarding-day-1-checklist.md`

## Flujo Operativo (canonico)

- Estrategia de arquitectura: monolito modular evolutivo (sin migracion a microservicios full en esta fase).
- Estrategia de datos: DB por dominio con PostgreSQL como target estrategico.
- Flujo de entrega obligatorio: Jira -> SDD-Orchestrator -> Engram -> GGA -> PR/Merge.
- Entrega por dominios completos con ownership explicito (backend + frontend + DB + docs).

## Arquitectura

- `docs/architecture/overview.md` - baseline tecnico vigente del sistema.
- `docs/architecture/domain-map.md` - ownership por dominio y estado de migracion.
- `docs/architecture/context-map.md` - limites de contexto y relaciones.
- `docs/architecture/dependency-rules.md` - reglas de dependencias y anti-acoplamiento.
- `docs/architecture/db-ownership-migration-policy.md` - politica de ownership DB y migracion.
- `docs/architecture/repo-navigation-map.md` - donde tocar segun tipo de cambio.

## Guides

- `docs/guides/pr-merge-governance.md` - governance de PR y gates de merge.
- `docs/guides/domain-dor-dod.md` - Definition of Ready / Definition of Done por dominio.
- `docs/guides/incremental-domain-migration.md` - coexistencia old/new y plan incremental.
- `docs/guides/ai-skills-matrix.md` - matriz activa de skills y auto-invoke.

## API

- `docs/api/README.md` - indice de contratos API.
- `docs/api/standards.md` - estandares transversales de contrato.
- `docs/api/modules/auth.md`
- `docs/api/modules/rbac.md`
- `docs/api/modules/catalogos.md`
- `docs/api/modules/doc_front.md`

## Getting Started

- `docs/getting-started/setup.md` - setup local y por Docker.
- `docs/getting-started/ai-team-workflow.md` - runbook diario de trabajo con IA.
- `docs/getting-started/onboarding-day-1-checklist.md` - checklist day-1.
- `docs/getting-started/engram-team-sync.md` - hooks y sincronizacion de memoria compartida.

## Templates

- `docs/templates/README.md`
- `docs/templates/guide-template.md`
- `docs/templates/adr-template.md`
- `docs/templates/rfc-cross-domain-template.md`

## Governance minima para cambios cross-domain

Si un cambio toca mas de un dominio, deben estar alineados estos artefactos:

- `docs/architecture/domain-map.md`
- `docs/architecture/context-map.md`
- `docs/architecture/dependency-rules.md`
- `docs/architecture/db-ownership-migration-policy.md`
- `docs/architecture/repo-navigation-map.md`
- `docs/guides/pr-merge-governance.md`
- `docs/guides/domain-dor-dod.md`
- `docs/guides/incremental-domain-migration.md`
- `docs/templates/rfc-cross-domain-template.md`

## Convenciones de mantenimiento

- Mantener docs accionables y sin duplicidad.
- Remover contenido obsoleto en lugar de mantener playbooks legacy.
- Actualizar este indice cada vez que se agrega o elimina documentacion relevante.
