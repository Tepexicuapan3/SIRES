# Incremental Domain Migration (old -> new)

> TL;DR: Coexistencia controlada entre runtime legacy y estructura target. Migracion por dominios piloto, sin big-bang, con estrategia `DB por dominio` y PostgreSQL como destino.

## Problem / Context

Mover todo de una sola vez rompe rutas, imports y operacion. Ademas, la sobrecarga de datos exige una migracion por etapas hacia PostgreSQL con ownership por dominio.

## Solution / Implementation

## Estados de dominio

- `legacy`: implementacion principal en `backend/apps` + `frontend/src/features`.
- `hybrid`: parte del dominio ya vive en `backend/domains` y/o `frontend/src/domains` con adapters.
- `domain-first`: nueva estructura es canonica; legacy queda solo como compatibilidad temporal o se retira.

## Estrategia de migracion

1. Elegir dominio piloto y slice vertical acotado.
2. Crear scaffolding en `backend/domains/<dominio>` y/o `frontend/src/domains/<dominio>`.
3. Definir ownership de datos del dominio en PostgreSQL (schema/tablas/migraciones/indices).
4. Implementar adapters/read-models para convivir con runtime actual sin acceso SQL cross-domain.
5. Ejecutar migracion de datos por fases (`expand -> migrate -> contract`) con rollback documentado.
6. Validar contratos, carga y observabilidad; actualizar docs.
7. Repetir por slice hasta cerrar DoD del dominio.

## Etapas de aislamiento de datos

1. **Aislamiento logico (default)**: dominio owner en schema/namespace PostgreSQL compartido.
2. **Aislamiento fisico (opcional por dominio)**: DB dedicada cuando cumpla criterios de volumen/SLO/blast radius/compliance.

La transicion a aislamiento fisico no implica romper el monolito modular: el contrato entre dominios sigue siendo API/eventos/read-models.

## Evolucion de arquitectura por etapas (control de cambio)

- **Etapa 1**: consolidar boundaries y ownership de dominio en infraestructura PostgreSQL compartida.
- **Etapa 2**: endurecer confiabilidad/performance/observabilidad/seguridad por dominio sin romper contratos.
- **Etapa 3**: evaluar extraccion/separacion fisica solo con evidencia operativa o de compliance.
- Regla dura: no aprobar cambios de arquitectura por hype/preferencia sin necesidad medible y decision documentada.

## Controles de sobrecarga por dominio

- Particionado de tablas en dominios de alta escritura/consulta.
- Estrategia de indices por patrones reales de query.
- Politicas de retencion y archivo para historicos.
- Read-models para reporting pesado.
- Observabilidad minima: latencia SQL, locks, crecimiento de tablas e impacto de planes de ejecucion.

## Tracker inicial

| Dominio | Estado actual | Siguiente paso |
|---|---|---|
| Recepcion | legacy (scaffold listo en `backend/domains/recepcion` y `frontend/src/domains/recepcion`) | iniciar slice piloto en `hybrid` |
| Somatometria | legacy | iniciar slice piloto en `hybrid` |
| Consulta Medica | legacy | mapear dependencias antes de migrar |
| Auth & Access | domain-first (backend domain scaffold + frontend auth/rbac operativo en `frontend/src/domains/auth-access/**`; Lote 5 retira wrappers legacy en `features/auth/**` y `features/admin/modules/rbac/**`; reintento Lote 5 validado sin consumidores runtime/test) | mantener guardrail de no-regresión (suites auth/rbac focalizadas en Docker) y limpiar referencias documentales legacy cuando se cierre PR |

## References

- `backend/domains/README.md`
- `frontend/src/domains/README.md`
- `docs/architecture/db-ownership-migration-policy.md`
- `docs/guides/domain-dor-dod.md`
- `docs/getting-started/onboarding-day-1-checklist.md`
