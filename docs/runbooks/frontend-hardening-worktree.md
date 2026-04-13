# Frontend hardening worktree (F0)

## Objetivo

Aislar `frontend-stability-hardening` sin tocar el working tree sucio de `chore/kan-70-apply`.

## Pasos

1. Verificar rama actual y estado:
   - `git status --short --branch`
2. Crear rama fix desde `main` (sin checkout en rama sucia):
   - `git branch fix/frontend-stability-hardening main`
3. Crear o reutilizar worktree dedicado:
   - `git worktree add ../SISEM-worktrees/frontend-stability-hardening fix/frontend-stability-hardening`
4. Ejecutar implementación y validaciones desde el worktree:
   - `docker compose run --rm frontend sh -lc "bun install && bun run <command>"`

## Validación mínima

- Rama aislada activa en worktree:
  - `git -C ../SISEM-worktrees/frontend-stability-hardening status --short --branch`
- Rama original intacta:
  - `git -C . status --short --branch`

## Rollback

1. Revertir commits problemáticos en `fix/frontend-stability-hardening`.
2. Si el aislamiento ya no se necesita:
   - `git worktree remove ../SISEM-worktrees/frontend-stability-hardening`
