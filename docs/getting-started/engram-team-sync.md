# Engram Team Sync

> TL;DR: SIRES usa hooks Git versionados para exportar/importar memoria compartida automaticamente. Para el flujo completo diario con SDD-Orchestrator + GGA, ver `docs/getting-started/ai-team-workflow.md`.

## Problem / Context

Sin hooks versionados, cada dev guarda memoria en su base local y el contexto compartido en `.engram/` queda desactualizado o depende de pasos manuales.

En SIRES, el objetivo es compartir decisiones importantes de arquitectura, fixes y descubrimientos (no ruido operativo) con el menor mantenimiento manual posible.

## Solution / Implementation

Se versionaron hooks en `.githooks/` y scripts en `.engram/scripts/`:

- `commit-msg` llama `.engram/scripts/export-on-commit-msg.sh`.
- `post-merge`, `post-checkout` y `post-rewrite` llaman `.engram/scripts/import-on-repo-update.sh`.
- `.engram/scripts/install-hooks.sh` activa `core.hooksPath=.githooks` y asegura permisos ejecutables.

### Politica shared vs local (resumen)

La separacion se hace por proyecto de Engram:

- `project: SIRES_SHARED` -> conocimiento de alto valor para el equipo (esto si se exporta a `.engram/`).
- `project: SIRES_LOCAL` -> notas personales o ruido operativo (no forma parte del sync compartido).

El hook exporta en cada commit solo el proyecto compartido (`SIRES_SHARED` por defecto). Asi evitamos subir ruido local sin pedir pasos manuales.

Si necesitas el runbook operativo completo (inicio/durante/cierre/PR), usa la guia principal: `docs/getting-started/ai-team-workflow.md`.

## Examples

Activacion one-time por dev:

```bash
./.engram/scripts/install-hooks.sh
git config --get core.hooksPath
```

Opcional: cambiar proyecto compartido por entorno:

```bash
export ENGRAM_SHARED_PROJECT_NAME="SIRES_SHARED"
```

Desactivar temporalmente la exportacion automatica en un commit puntual:

```bash
ENGRAM_SYNC_DISABLE=1 git commit -m "chore: commit sin sync engram"
```

Eventos de import automatico:

- `git pull` (via `post-merge`)
- `git checkout <branch>` (via `post-checkout` cuando cambia de rama)
- `git rebase` (via `post-rewrite`)

## References

- `.githooks/commit-msg`
- `.githooks/post-merge`
- `.githooks/post-checkout`
- `.githooks/post-rewrite`
- `.engram/scripts/export-on-commit-msg.sh`
- `.engram/scripts/import-on-repo-update.sh`
- `.engram/scripts/install-hooks.sh`
