# DB Ownership & Migration Policy

> TL;DR: SIRES adopta `DB por dominio` con PostgreSQL como target. Se mantiene monolito modular, pero con ownership estricto por dominio, sin acceso SQL cross-domain y migracion incremental desde el estado legacy.

## Problem / Context

La sobrecarga de datos en SIRES exige una estrategia de escalado mas robusta. El esquema actual legacy no separa ownership de datos por dominio de forma suficiente para soportar el plan de evolucion del monolito modular.

Necesitamos reglas explicitas para:

- ownership de tablas/esquemas,
- integracion entre dominios sin acoplamiento SQL,
- migracion incremental a PostgreSQL sin romper el plan de monolito modular.

## Solution / Implementation

## Definicion practica de DB por dominio (SIRES)

`DB por dominio` en SIRES significa separar ownership de datos por dominio con dos niveles evolutivos:

1. **Aislamiento logico (etapa actual/preferida en Fase 1)**
   - Cada dominio tiene ownership de su modelo de datos en PostgreSQL (schemas, tablas, migraciones e indices).
   - Puede convivir en la misma instancia/cluster PostgreSQL, pero con fronteras de ownership claras.
2. **Aislamiento fisico (etapa futura por dominio)**
   - Un dominio pasa a DB dedicada cuando su carga/criticidad lo justifica.
   - El contrato entre dominios no cambia: API/eventos/read-models.

Este enfoque mantiene el plan incremental del monolito modular y evita redisenos de datos cuando un dominio necesite mayor aislamiento en etapas futuras.

## Ownership de datos en PostgreSQL

- Cada tabla, schema e indice debe tener dominio owner y owner tecnico responsable.
- Las migraciones se definen y ejecutan por dominio owner.
- Tablas `shared` nuevas estan prohibidas salvo excepcion aprobada por RFC cross-domain.
- Cualquier cambio sobre activos de otro dominio requiere RFC y aprobacion de owners impactados.

## Regla de acceso cross-domain

- Prohibido el acceso directo cross-domain a tablas/esquemas desde codigo de aplicacion.
- Integracion permitida entre dominios:
  - API versionada,
  - eventos,
  - read-models/materializaciones para reporting.
- Si un dominio necesita datos de otro, consume contrato; no consulta SQL directa al schema ajeno.

## Estrategia de migracion a PostgreSQL orientada por dominio

1. Inventariar tablas legacy y mapear owner por dominio.
2. Definir target PostgreSQL por dominio (schema naming, indices base, constraints).
3. Ejecutar migracion incremental por slices (`expand -> migrate -> contract`), con PRs chicos.
4. Mantener compatibilidad temporal con adapters/read-models donde sea necesario.
5. Cerrar dominio cuando complete validacion funcional, de performance y operativa.

No se permite migracion big-bang.

## Controles para sobrecarga de datos

Controles minimos por dominio con alta carga:

- particionado de tablas por fecha/tenant/clave funcional cuando aplique,
- estrategia de indices (btree/partial/covering) revisada por patrones de consulta,
- politicas de retencion y archivo (datos calientes vs historicos),
- read-models para reporting y consultas pesadas fuera del camino transaccional,
- observabilidad de base de datos: latencia de queries, bloat, locks, crecimiento por tabla, costo de planes.

## Criterios para pasar de aislamiento logico a fisico

Un dominio puede pasar a DB fisica dedicada cuando cumpla uno o mas criterios sostenidos:

- volumen y crecimiento de datos superan umbrales operativos acordados,
- SLO de latencia/throughput no se mantiene con aislamiento logico,
- blast radius de incidentes justifica separacion,
- requerimientos de compliance o seguridad exigen aislamiento fuerte,
- dependencia de release cadence distinta al resto del monolito.

La decision debe quedar en RFC + ADR con plan de rollout y rollback.

## Checklist minimo por cambio DB

- Dominio owner definido.
- Engine objetivo PostgreSQL considerado en diseno/migracion.
- Sin acceso SQL cross-domain en codigo de aplicacion.
- Impacto en queries/reportes identificado (incluyendo read-models si aplica).
- Plan de datos legacy -> PostgreSQL documentado.
- Estrategia de particionado/indices/retencion evaluada para tablas de alta carga.
- Plan de observabilidad y rollback incluido para cambios de alto riesgo.
- Validacion manual/automatica incluida en ticket.

## References

- `docs/templates/rfc-cross-domain-template.md`
- `docs/guides/pr-merge-governance.md`
- `docs/guides/domain-dor-dod.md`
