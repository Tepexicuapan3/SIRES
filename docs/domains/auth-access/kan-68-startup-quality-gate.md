# KAN-68 - Startup Quality Gate Evidence

> TL;DR: Se ejecutó el plan KAN-68 en modalidad PR-first, con validaciones Docker-first de pre-deploy, ensayo de rollback documental-operativo y checklist go/no-go explícito para decisión de release.

## 1) Scope ejecutado

- Ticket: `KAN-68`
- Dominio: `auth-access` (`domain-first`)
- Objetivo: quality gate de startup (`pre-deploy validation`, `rollback rehearsal`, `go/no-go`)

Incluye:

- Apertura de PR previa a la ejecución del plan (workflow requerido por usuario).
- Evidencia de validaciones en contenedores Docker.
- Rehearsal de rollback para cambios docs-only del ticket.
- Checklist de salida para decisión operacional.

No incluye:

- Cambios de runtime backend/frontend.
- Cambios de contrato API.
- Cambios de datos/migraciones.

## 2) Evidencia PR-first

- Rama de trabajo: `chore/auth-access/KAN-68-startup-quality-gate`
- PR creada antes de ejecutar validaciones: `#68`
- Commit bootstrap inicial: artefacto mínimo de KAN-68 + indexación en `docs/README.md`

## 3) Pre-deploy validation (Docker-first)

### Precondición

```bash
docker compose up -d auth-db redis backend frontend
docker compose ps
```

Resultado:

- `auth-db`: `Up (healthy)`
- `redis`: `Up (healthy)`
- `backend`: `Up (healthy)`
- `frontend`: `Up`

### Checks ejecutados

1. Django system check

```bash
docker compose exec -T backend python manage.py check
```

Resultado:

- `System check identified no issues (0 silenced).`

2. Auth contract alignment (frontend integration)

```bash
docker compose exec -T frontend bun run test:run src/test/integration/contracts/auth-contract-alignment.spec.ts
```

Resultado:

- `1 file passed`, `1 test passed`

3. RBAC authz matrix (backend)

```bash
docker compose exec -T backend python manage.py test apps.administracion.tests.test_rbac_authz_matrix -v 2
```

Resultado:

- `Ran 5 tests ... OK`

4. E2E bootstrap smoke (docker)

```bash
docker compose exec -T frontend bun run test:e2e:bootstrap
```

Resultado:

- `FAILED` en preflight por error de red al descargar dependencias (`FailedToOpenSocket` / `ConnectionRefused` sobre tarballs de npm).
- No evidencia de fallo funcional de aplicación; bloqueo de infraestructura/reachability del registry.

## 4) Rollback rehearsal (docs-only)

Tipo de cambio: docs-only con blast radius bajo.

Ensayo documentado de rollback:

1. Identificar commits del ticket en la rama KAN-68.
2. Revertir commits del ticket en orden inverso:

```bash
git revert <commit_nuevo>
git revert <commit_bootstrap>
```

3. Verificar que el estado vuelve al baseline pre-KAN-68:

```bash
git diff main...HEAD -- docs/domains/auth-access docs/README.md
```

4. Re-ejecutar checks mínimos Docker-first (`manage.py check` + auth contract alignment).

Resultado esperado del rehearsal:

- Rollback inmediato, sin migraciones, sin impacto en datos y sin cambios de contrato.

## 5) Go / No-Go checklist

- [x] PR-first workflow cumplido (PR abierta antes de la ejecución del plan)
- [x] Rama Jira-compliant creada desde `main` actualizado
- [x] Validaciones base Docker (`services up/healthy`, `manage.py check`) en verde
- [x] Pruebas de contrato/authz en verde (`auth-contract-alignment`, `rbac_authz_matrix`)
- [x] Plan de rollback explícito y verificable para docs-only
- [ ] Smoke E2E bootstrap en verde

Decisión actual: **NO-GO condicional**

- Motivo: smoke E2E bootstrap no pudo completarse por bloqueo de red en preflight de dependencias.
- Condición para pasar a GO: re-ejecutar `test:e2e:bootstrap` en entorno con acceso de red al registry y adjuntar salida verde en PR/Jira.

## 6) Referencias

- `docs/guides/pr-merge-governance.md`
- `docs/domains/auth-access/jira-workflow-operating-model.md`
- `docs/domains/auth-access/tdd-evidence-templates.md`
- `.github/pull_request_template.md`
