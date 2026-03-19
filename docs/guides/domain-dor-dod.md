# Domain DoR / DoD

> TL;DR: Un dominio entra al sprint solo con requisitos minimos (DoR) y se considera cerrado cuando cumple Definition of Done transversal.

## Problem / Context

La migracion por dominios falla si no hay criterio comun para empezar y terminar trabajo.

## Solution / Implementation

## Definition of Ready (DoR)

- Dominio y ownership definidos (backend/frontend/DB/docs).
- Alcance limitado al slice vertical de negocio.
- Contratos API o cambios de datos identificados.
- Riesgos y dependencias externas listadas.
- Ticket Jira creado y vinculado a Epic del dominio.
- Cambio SDD creado (o justificacion explicita de por que no aplica).

## Definition of Done (DoD)

- Backend y frontend del slice funcionando en entorno local.
- Seguridad respetada (JWT cookies HttpOnly, CSRF en mutaciones).
- Docs actualizadas (mapa, migracion, governance si aplica).
- Engram actualizado con decisiones/fixes relevantes (`SIRES_SHARED`).
- Gate de GGA en pre-commit ejecutado y sin bloqueos pendientes.
- PR mergeable con checklist completo y reviewers correctos.

## DoD extendido para dominio piloto cerrado

- Estado del dominio pasa a `domain-first` o queda `hybrid` con backlog claro.
- Dependencias cross-domain documentadas y aprobadas.
- Plan de siguientes slices registrado.

## References

- `docs/architecture/domain-map.md`
- `docs/guides/incremental-domain-migration.md`
- `docs/guides/pr-merge-governance.md`
- `docs/getting-started/ai-team-workflow.md`
