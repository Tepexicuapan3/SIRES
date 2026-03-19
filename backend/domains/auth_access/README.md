# Backend Domain Scaffold: auth_access

Dominio base para aislamiento de autenticacion/autorizacion en arquitectura domain-first.

Estado inicial: `legacy` (runtime sigue en `backend/apps/authentication`).

## Estructura

- `presentation/` - endpoints DRF, serializers, permissions
- `use_cases/` - casos de uso del dominio
- `infrastructure/` - repositorios e integraciones
- `domain/` - entidades/value objects/servicios de dominio
- `tests/` - pruebas del dominio

## Guardrail

No mover runtime funcional en esta fase. Solo scaffolding y documentacion.
