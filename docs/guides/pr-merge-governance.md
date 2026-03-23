# PR / Merge Governance (Domain-First)

> TL;DR: PRs chicos, trazables y alineados a dominio. Nada de merges opacos, ni cambios cross-domain sin control, ni cambios de datos sin ownership y plan de migracion a PostgreSQL.

## Problem / Context

Sin governance, el trabajo paralelo genera colisiones, retrabajo y deuda tecnica silenciosa.

## Solution / Implementation

## Reglas de PR

1. Una intencion principal por PR.
2. Referencia obligatoria a ticket Jira.
3. Referencia obligatoria al cambio SDD (si aplica).
4. Indicar dominio(s) impactado(s) y estado (`legacy`, `hybrid`, `domain-first`).
5. Si cruza dominios, adjuntar RFC corto usando template.
6. No mezclar refactor de estructura con cambios funcionales grandes sin justificacion.
7. Si hay impacto de datos, detallar ownership de dominio, etapa de migracion (`expand/migrate/contract`) y riesgo operativo.
8. Si cambia boundaries/flujo arquitectonico, actualizar docs impactados en el mismo PR (estandares vivos).
9. Incluir owners primario/secundario por dominio impactado (backend, frontend, DB, docs) en descripcion o checklist del PR.
10. Para NEW feature/NEW functionality/LARGE refactor, aplicar TDD-first estricto: tasks de testing primero y ciclo Red -> Green -> Refactor.

## Workflow obligatorio de branch y PR

- Cada developer crea una rama NUEVA por ticket partiendo desde `main` actualizado.
- Todo el trabajo del ticket ocurre solo en esa rama (sin mezclar multiples tickets en la misma rama).
- Cuando el ticket esta completo y testeado, se abre PR hacia `main`.
- Los cambios en `main` se integran unicamente via PR (sin pushes directos).
- La rama del ticket se elimina al hacer merge o al cerrar el PR sin merge.

### Convencion de nombres de rama

- Formato recomendado: `<tipo>/<dominio>/<jira-key>-<slug>`.
- Tipos permitidos: `feat`, `fix`, `chore`.
- Ejemplos:
  - `feat/auth/SIRES-142-jwt-refresh-rotation`
  - `fix/consulta/SIRES-287-validacion-receta`
  - `chore/docs/SIRES-310-ajuste-pr-governance`

## Gates minimos de merge

- Checklist de seguridad (JWT HttpOnly + CSRF para mutaciones).
- Validacion de reglas de dependencia (`docs/architecture/dependency-rules.md`).
- Evidencia de testing relevante (sin necesidad de build completo en docs-only PR).
- Evidencia de testing proporcional al riesgo para features criticas (unit/integration/API/E2E segun impacto).
- Evidencia test-first cuando aplique TDD estricto: fallo inicial, progresion de implementacion y estado final en verde.
- Si hubo excepcion TDD, incluir racional explicito, controles/tests compensatorios y aprobacion registrada en Jira/PR.
- Confirmacion de actualizacion de docs cuando cambia la operativa.
- Evidencia de memoria high-signal guardada en Engram (`SIRES_SHARED`) cuando corresponda.
- Gate de `pre-commit` con GGA ejecutado sin bloqueos pendientes.
- Checklist de datos completo: ownership por dominio en PostgreSQL, sin SQL cross-domain directo, y plan de rollback en cambios de alto riesgo.

## Collaboration baseline (obligatorio)

- Estandares de arquitectura y governance se tratan como artefactos vivos; no se difieren updates de docs a "PR posterior".
- DoD de dominio es unico y se evalua con la misma base en todo el repo.
- Review de arquitectura no es opcional: PRs con impacto de boundaries/flows requieren validacion explicita de compliance (no solo lint/format).

### Como leer bloqueos de GGA

- `blocker:domain-boundary` -> corregir acoplamiento cross-domain via contratos (API/evento/read-model).
- `blocker:db-ownership` -> corregir ownership por dominio, eliminar SQL cross-domain y alinear migracion a PostgreSQL.
- `blocker:contract-error-policy` -> unificar contrato/API y manejo de errores segun politica vigente.
- `blocker:traceability` -> agregar RFC/ADR/docs cuando cambia arquitectura, boundaries o politica de datos.

Un warning no bloquea commit, pero debe quedar en checklist de PR con responsable y fecha objetivo.

## Checklist de impacto de datos/migraciones

- Dominio owner de datos identificado.
- Tablas/schemas/migraciones afectados documentados.
- Cumple estrategia `DB por dominio` (PostgreSQL target).
- No hay acceso SQL directo a tablas/schemas de otro dominio.
- Controles de sobrecarga evaluados (particionado, indices, retencion/archivo, read-models/reporting, observabilidad).
- Criterio de paso logico -> fisico evaluado (si aplica).
- Rollback y monitoreo post-merge definidos.

## Convencion de labels sugerida

- `type:feature`, `type:fix`, `type:docs`, `type:chore`
- `domain:recepcion`, `domain:somatometria`, `domain:consulta`, `domain:auth`
- `status:legacy`, `status:hybrid`, `status:domain-first`

## References

- `.github/pull_request_template.md`
- `docs/architecture/db-ownership-migration-policy.md`
- `docs/templates/rfc-cross-domain-template.md`
- `docs/guides/domain-dor-dod.md`
- `docs/getting-started/ai-team-workflow.md`
