# Backend Domain Scaffold: recepcion

Dominio base para evolucion incremental de recepcion sin romper runtime actual.

Estado inicial: `legacy` (runtime sigue en `backend/apps/recepcion`).

## Estructura

- `presentation/`
- `use_cases/`
- `infrastructure/`
- `domain/`
- `tests/`

## Guardrail

Extraccion por slices verticales con adapters temporales hasta cerrar DoD del dominio.
