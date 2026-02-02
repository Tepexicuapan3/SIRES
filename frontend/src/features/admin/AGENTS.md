# AGENTS.md - Admin Feature Ruleset

## Alcance

- Aplica a `frontend/src/features/admin/**`.
- Sigue el estilo de `frontend/src/features/auth/` para queries y mutations.

## Reglas

- No usar adapters: el backend entrega camelCase segun `docs/api/modules/rbac.md`.
- Queries y mutations separados por modulo y con keys dedicadas.
- UI no realiza HTTP directo; usa hooks que llaman `api/resources`.
- Reutilizable va en `shared/`; lo especifico en `modules/<modulo>/`.
- Catalogos: separar por catalogo en `modules/catalogos/<catalogo>/`.

## Estructura por modulo

Cada submodulo repite esta base:

```txt
pages/
components/
queries/
mutations/
domain/
utils/
```

## Catalogos actuales

- `centros-atencion`
- `areas`
