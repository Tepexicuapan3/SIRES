# Backend Domains (Estructura Objetivo)

> TL;DR: `backend/domains/` es la estructura objetivo para migracion incremental por dominios. `backend/apps/` sigue siendo runtime activo hasta cerrar cada dominio piloto.

## Problem / Context

El backend actual funciona desde `backend/apps/`, pero el equipo necesita trabajar por dominios completos sin choques entre frentes.

## Solution / Implementation

- Este directorio define la estructura destino por dominio.
- La migracion es `old -> new` por slices, sin big-bang.
- Se permiten wrappers/adapters temporales para convivir con `apps`.

### Scaffolding base creado en Fase 1

- `backend/domains/auth_access/` (Auth & Access)
- `backend/domains/recepcion/` (Recepcion)

Estos directorios son solo base estructural y no reemplazan runtime actual.

### Plantilla base por dominio

```text
backend/domains/<domain>/
  presentation/     # DRF views/serializers/permissions
  use_cases/        # application services
  infrastructure/   # repositories/integrations
  domain/           # entities/value objects/domain services
  tests/            # tests del dominio
```

## References

- `docs/architecture/domain-map.md`
- `docs/architecture/dependency-rules.md`
- `docs/guides/incremental-domain-migration.md`

## Reglas accionables por capa

- `presentation/`: transporte DRF (request/response, validacion, mapeo).
- `use_cases/`: orquestacion de casos de uso y limites transaccionales.
- `domain/`: invariantes y reglas de negocio.
- `infrastructure/`: repositorios ORM e integraciones.

## Anti-patrones prohibidos

- Logica critica de negocio en `presentation/`.
- Acceso directo a tablas/esquemas de otros dominios.
- Repositorios de fachada sin justificar complejidad real.
- Introducir CQRS/event sourcing full en esta fase.

## Guardrails Part 2 (operativo)

- La comunicacion entre dominios se hace solo por contratos de servicio/query, orquestador de casos de uso o eventos de dominio internos.
- Realtime es excepcion controlada: los handlers delegan decisiones de negocio a `use_cases/`.
- Operaciones criticas deben dejar auditoria minima (`actor`, `timestamp`, `action`, `domain`, `resource`, `result`, `contextId/requestId`; y `beforeState/afterState` en mutaciones).
- Autorizacion basada en permisos atomicos y policies centralizadas; backend es la fuente de verdad.

## Checklist rapido para cambios en dominios backend

- [ ] El cambio mantiene capas separadas.
- [ ] No hay reglas de negocio criticas en transporte.
- [ ] Si se uso Repository, hay justificacion tecnica concreta.
- [ ] Si hay eventos, primero son internos al dominio.
- [ ] La comunicacion cross-domain usa contrato/orquestador/evento (sin acceso directo a tablas ajenas).
- [ ] Si hay realtime, el handler no decide negocio critico.
- [ ] Operaciones criticas verifican contrato de auditoria minimo.
- [ ] Autorizacion valida permisos atomicos por policy central.

## Guardrails Part 3 (operativo)

- Politica DB para esta fase: una sola fuente operativa en PostgreSQL, con ownership estricto por dominio y aislamiento logico; la separacion fisica se evalua despues con criterios documentados.
- Cada cambio de persistencia debe dejar explicito: integridad (PK/FK, unicidad, nullability, indices), limite transaccional en `use_cases/` y estrategia de concurrencia para hot paths.
- DoD y docs de arquitectura/migracion se actualizan en el mismo PR cuando cambian limites, ownership o contratos.
- Testing por riesgo: priorizar authz/auditoria, transiciones criticas y flujos sensibles a concurrencia antes de merge.
- Evolucion por etapas: primero scaffolding aditivo, luego hardening; evitar saltos de arquitectura por moda.

## Checklist Part 3

- [ ] El cambio mantiene wording DB reconciliado (PostgreSQL unico operativo ahora + separacion fisica posterior por criterio).
- [ ] Integridad, transacciones y concurrencia quedaron documentadas para el dominio.
- [ ] Se actualizo DoD/migracion/docs de arquitectura en el mismo PR.
- [ ] Hay cobertura automatizada proporcional al riesgo del flujo critico.
- [ ] No se introdujo complejidad prematura sin evidencia.
