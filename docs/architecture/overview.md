# Arquitectura SIRES (baseline vigente)

> TL;DR: SIRES opera como monolito modular evolutivo con frontend React 19 + backend Django/DRF. El delivery se organiza por dominio y la estrategia de datos es DB por dominio con PostgreSQL como target.

## Problem / Context

El sistema necesita evolucionar sin romper la operacion actual. Un cambio big-bang de arquitectura o de base de datos no es viable por riesgo operativo y acoplamiento historico.

## Solution / Implementation

## Stack vigente

### Backend

- Django 5 + Django REST Framework.
- Redis para capacidades de soporte (cache/realtime).
- Runtime actual con MySQL en transicion.
- Target estrategico: PostgreSQL por dominio.

### Frontend

- React 19 + TypeScript + Vite.
- TanStack Query para server state.
- Zustand para UI state.
- Zod + React Hook Form para validacion/formularios.

## Modelo operativo de arquitectura

1. Monolito modular evolutivo (sin migracion full a microservicios ahora).
2. Trabajo por dominios completos con ownership explicito.
3. Coexistencia old/new (`legacy`, `hybrid`, `domain-first`) hasta cerrar DoD.
4. Integracion cross-domain solo por contratos (API/eventos/read-models), no por SQL directo.

## Capas y boundaries

### Backend

```text
presentation (views/serializers)
  -> use_cases
    -> infrastructure/repositories
      -> DB del dominio
```

- `presentation` mapea HTTP y permisos.
- `use_cases` contiene reglas de negocio.
- `infrastructure` implementa acceso a datos e integraciones.

### Frontend

```text
routes/pages
  -> domain components/hooks
    -> api resources
      -> backend API
```

- HTTP solo en `frontend/src/api/`.
- Componentes no acceden directamente a transporte.
- Estado de servidor y estado UI se separan.

## Seguridad base

- JWT en cookies HttpOnly.
- CSRF obligatorio (`X-CSRF-TOKEN`) en operaciones mutantes.
- Sin tokens en localStorage/sessionStorage.

## Flujo de entrega

Jira -> SDD-Orchestrator -> implementacion por dominio -> Engram -> GGA -> PR/Merge.

## References

- `docs/architecture/domain-map.md`
- `docs/architecture/context-map.md`
- `docs/architecture/dependency-rules.md`
- `docs/architecture/db-ownership-migration-policy.md`
- `docs/guides/pr-merge-governance.md`
