# Frontend Domains (Estructura Objetivo)

> TL;DR: `frontend/src/domains/` es el destino para modularizacion por dominio. `frontend/src/features/` sigue operando mientras la migracion sea incremental.

## Problem / Context

El frontend actual esta orientado a features. Para trabajo paralelo IA-first por ownership, se requiere estructura por dominio sin romper rutas activas.

## Solution / Implementation

- Mantener `features` como runtime principal durante Fase 1.
- Introducir `domains` para nuevos slices y extracciones controladas.
- Conectar con rutas existentes via adapters hasta completar cada dominio piloto.

### Scaffolding base creado en Fase 1

- `frontend/src/domains/auth-access/` (Auth & Access)
- `frontend/src/domains/recepcion/` (Recepcion)

Estos directorios son base de migracion incremental y no reemplazan rutas activas.

### Plantilla base por dominio

```text
frontend/src/domains/<domain>/
  components/   # presentational/container
  hooks/        # orchestration + query/mutation hooks
  pages/        # screens del dominio
  state/        # Zustand slices del dominio
  adapters/     # mapping con contracts existentes
  types/        # domain contracts
```

## References

- `docs/architecture/domain-map.md`
- `docs/architecture/dependency-rules.md`
- `docs/guides/incremental-domain-migration.md`

## Reglas accionables por capa

- `components/` y `pages/`: capa de presentacion (render + interaccion).
- `hooks/`: orquestacion de flujos/casos de uso frontend.
- `state/`: estado de dominio y transiciones.
- `adapters/`: mapeo de contratos externos.
- `types/`: contratos y tipos del dominio.

## Anti-patrones prohibidos

- Logica de negocio critica en componentes/paginas o utilidades UI genericas.
- HTTP directo desde `components/` o `pages/`.
- Acoplamiento cross-domain por imports directos sin contratos.

## Guardrails Part 2 (operativo)

- Integracion entre dominios solo por contratos API, adapters explicitos o eventos documentados.
- Realtime es excepcion controlada: handlers/eventos del cliente delegan decisiones a `hooks/` o modulos de dominio.
- En acciones sensibles, propagar metadata de correlacion (ej. `X-Request-ID`) para trazabilidad de auditoria backend.
- Permisos en frontend son gating UX; autorizacion real se valida en backend con permisos atomicos y policies centralizadas.

## Checklist rapido para cambios en dominios frontend

- [ ] La capa de presentacion no contiene reglas de negocio criticas.
- [ ] La orquestacion vive en `hooks/` o modulos de dominio.
- [ ] Integraciones/API pasan por adapters y contratos explicitos.
- [ ] No se introdujo complejidad innecesaria en esta fase.
- [ ] No hay imports cross-domain directos fuera de contrato/adapters.
- [ ] Si hay realtime, no resuelve autorizacion ni negocio critico en handlers.
- [ ] Flujos sensibles incluyen metadata para auditoria backend.
- [ ] Gating de permisos usa policies/dependencias, no strings ad-hoc.

## Guardrails Part 3 (operativo)

- Alinear contratos con estrategia DB backend: PostgreSQL unico operativo hoy, ownership estricto por dominio y aislamiento logico; no asumir atajos de datos cross-domain.
- Colaboracion/DoD: si cambia un limite de dominio o contrato, actualizar en el mismo PR la guia de migracion y docs de arquitectura relacionadas.
- Testing por riesgo: priorizar gates de permisos, trazabilidad de auditoria (`X-Request-ID`) y transiciones de estado criticas.
- Evolucion por etapas: extraer por slices, endurecer despues; evitar reescrituras grandes por preferencia o moda.
- Riesgos top: acoplamiento cross-domain oculto, reglas de negocio en presentacion y flujos criticos sin cobertura.

## Checklist Part 3

- [ ] Contratos nuevos no dependen de supuestos de DB cross-domain.
- [ ] Documentacion de limites/DoD se actualizo junto con el cambio.
- [ ] Los flujos criticos tienen pruebas automatizadas proporcionales al riesgo.
- [ ] La migracion se mantiene incremental (sin big-bang).
