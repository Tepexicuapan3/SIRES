# Dependency Rules (Domain-First)

> TL;DR: Dominio primero, dependencias explicitas, sin acoplamiento circular ni saltos de capas.

## Problem / Context

El trabajo paralelo por dominios solo escala si cada cambio respeta fronteras y contratos.

## Solution / Implementation

## Reglas obligatorias

1. **No circular deps** entre dominios.
2. **Backend clean boundaries**: `presentation -> use_cases -> infrastructure/domain`.
3. **Frontend boundaries**: `routes/pages -> domain hooks/components -> api resources`.
4. **No HTTP fuera de `frontend/src/infrastructure/api/resources/`**.
5. **No acceso DB cross-domain sin contrato** (facade, API o RFC aprobado).
6. **Shared solo para cross-cutting** (logging, auth primitives, realtime infra).
7. **Frontend quality gates desacoplados**: typecheck app/tests, contract-alignment y smoke docker corren como checks independientes y trazables.

## Reglas de coexistencia old/new

- `backend/apps` y `backend/domains` conviven durante migracion.
- `frontend/src/features` y `frontend/src/domains` conviven durante migracion.
- Un dominio puede estar en estado `legacy`, `hybrid` o `domain-first`.
- Cualquier cambio de estado se documenta en `docs/guides/incremental-domain-migration.md`.

## Gate de PR para dependencias

- Declarar dominios impactados.
- Validar que no se agregan imports prohibidos.
- Adjuntar RFC si hay cambio cross-domain de contratos o ownership.
- Si hay migraciones estructurales de runtime frontend (`app/`, `infrastructure/`, `shared/`), incluir evidencia documental de impacto en este archivo o en `docs/guides/incremental-domain-migration.md`.
- Si el PR toca auth/frontend stability, adjuntar evidencia de `typecheck:app`, `typecheck:tests`, `typecheck:e2e`, `typecheck:bun`, `test:guard:ts-debt-detection`, `test:guard:ts-anti-bypass`, `src/test/integration/contracts`, `test:e2e:bootstrap`, `test:e2e:smoke` y `test:guard:legacy-alias` en Docker con preflight.

## References

- `docs/architecture/context-map.md`
- `docs/guides/pr-merge-governance.md`
- `docs/templates/rfc-cross-domain-template.md`
