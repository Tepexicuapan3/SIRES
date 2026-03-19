# Flujo IA del Equipo (Jira + SDD-Orchestrator + Engram + GGA)

> TL;DR: En SIRES, el flujo oficial de delivery es Jira + SDD-Orchestrator + Engram + GGA. El trabajo se planifica y ejecuta por dominio completo, con ownership explicito y gates de calidad antes de merge.

## Problem / Context

Sin un proceso unificado, se pierde trazabilidad, se duplican decisiones y aparecen PRs que rompen boundaries entre dominios.

## Solution / Implementation

## Arquitectura operativa

```text
Persona
  -> Jira (epic/task por dominio)
  -> SDD-Orchestrator (explore/propose/spec/design/tasks/apply/verify)
  -> Implementacion por dominio
  -> Engram (memoria compartida high-signal)
  -> GGA (pre-commit gate)
  -> PR/Merge
```

## Reglas obligatorias

1. Dominio primero (backend + frontend + DB + docs).
2. Estrategia de datos: DB por dominio con PostgreSQL target.
3. Sin SQL cross-domain desde codigo de aplicacion.
4. Cross-domain changes requieren RFC corto y checklist de impacto.
5. No big-bang cutover; usar estados `legacy`, `hybrid`, `domain-first`.
6. Para NEW feature/NEW functionality/LARGE refactor, TDD-first es obligatorio (tasking de tests primero + Red -> Green -> Refactor).

## Protocolo diario

### Inicio

1. Validar ticket Jira y dominio owner.
2. Traer contexto en Engram (`SIRES_SHARED`).
3. Ejecutar fase SDD segun alcance (`/sdd-new`, `/sdd-continue`, `/sdd-apply`).

### Durante

1. Ejecutar trabajo por slices chicos.
2. Arrancar cada slice aplicable con test fallando (Red), luego implementacion minima (Green) y refactor seguro.
3. Guardar en Engram solo eventos high-signal (decisiones de arquitectura/tecnicas, bugfix raiz, convenciones, config).
4. Mantener Jira actualizado (In Progress / Review).

### Antes de PR

1. Verificar hooks activos y GGA disponible.
2. Revisar cambios por dominio.
3. Validar checklist de dependencia, datos y seguridad.
4. Adjuntar evidencia TDD-first cuando aplique (fallo inicial + progresion + verde final) o excepcion aprobada con controles compensatorios.

### Gate de commit (GGA + hooks)

En cada `git commit` deben ejecutarse dos validaciones automatizadas:

1. `pre-commit` ejecuta `./.gga/scripts/gga.sh run` con config en `.gga/gga/config` y rules en `.gga/rules.md`.
2. `commit-msg` ejecuta `.engram/scripts/export-on-commit-msg.sh` y sincroniza `SIRES_SHARED` en `.engram/`.

Si GGA falla, corregi primero la causa raiz:

- **Domain boundary**: mover integracion a contrato (API/evento/read-model) y eliminar acoplamiento directo.
- **DB ownership**: reasignar cambio al dominio owner, eliminar SQL cross-domain y documentar migracion por dominio.
- **Contrato/error policy**: normalizar manejo de errores y contratos entre dominios.
- **Traceability**: agregar RFC/ADR/docs cuando el cambio afecta arquitectura, boundaries o estrategia de datos.

No se debe bypassear el hook. El fix minimo correcto siempre es preferible a forzar el commit.

### Cierre de PR

1. Vincular ticket Jira y cambio SDD.
2. Declarar dominios impactados y estado (`legacy`/`hybrid`/`domain-first`).
3. Adjuntar RFC si hay impacto cross-domain.

## Engram (convencion minima)

- Proyecto compartido: `SIRES_SHARED`.
- Proyecto local: `SIRES_LOCAL`.

### Cuando guardar decisiones tecnicas/arquitectura

Guardar en `SIRES_SHARED` cuando haya impacto reutilizable para el equipo:

- Decision de arquitectura o trade-off cross-domain.
- Cambio de politica tecnica (errores, contratos, ownership de datos, seguridad operativa).
- Fix de bug con causa raiz no obvia.
- Convencion nueva que otros dominios deben respetar.

Usar formato:

- `What`: que decision/cambio se tomo.
- `Why`: por que se tomo.
- `Where`: archivos/rutas impactadas.
- `Learned`: riesgo, edge case o criterio operativo.

### Topic keys recomendados

- `feature/{slug}/decision`
- `feature/{slug}/progress`
- `bug/{id-or-slug}/fix`
- `ops/{area}/config`
- `docs/{topic}/note`

Ejemplos concretos:

- `feature/auth-domain/decision` para un cambio de contrato auth entre dominios.
- `feature/repo-operating-model/progress` para ajustar GGA/hooks/flujo operativo.
- `ops/postgresql-domain-ownership/config` para reglas de ownership y migraciones.

## Verificaciones rapidas

```bash
git config --get core.hooksPath
ls .githooks
which gga
```

## References

- `AGENTS.md`
- `docs/guides/pr-merge-governance.md`
- `docs/guides/domain-dor-dod.md`
- `docs/guides/incremental-domain-migration.md`
- `docs/getting-started/engram-team-sync.md`
