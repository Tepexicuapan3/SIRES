# auth-access - Backlog Mapping

> Mapeo canonico entre el PRD del dominio y la ejecucion en Jira/SDD.

## Objetivo

Mantener trazabilidad entre requerimientos (RF/NFR/RB/CA), olas de implementacion y backlog operativo.

## Mapeo por olas

| Ola PRD | Enfoque | Entradas PRD | Salida esperada en backlog |
|---|---|---|---|
| Ola 0 | Gobierno y baseline | Secciones 3, 5, 18, 19 | Tickets de definicion (owner, compliance, matriz permisos, retencion) |
| Ola 1 | Controles core de acceso | Secciones 8, 9, 10, 11, 12, 13 | Historias/tareas de ciclo de vida de acceso + autorizacion contextual + auditoria minima |
| Ola 2 | Autenticacion objetivo y excepciones | Secciones 7, 9, 10, 11, 12 | Historias/tareas de SSO (condicional), MFA y break-glass |
| Ola 3 | Endurecimiento operativo | Secciones 15, 16, 17, 20 | Historias/tareas de observabilidad, reportes SLA y ajustes por evidencia |

## Regla de trazabilidad

Cada ticket Jira de este dominio debe incluir referencia explicita a:

- Seccion(es) de `prd.md` (RF/NFR/RB/CA)
- Decision aplicable de `decision-log.md`
- Estado de pendientes en `pending-decisions.md` cuando corresponda

## Estado inicial

- La epic y tareas iniciales del dominio deben mantenerse alineadas con este mapeo.
- Si cambia el alcance del PRD, actualizar primero este documento y luego Jira/SDD.

## Dependencia explicita KAN-48 -> KAN-49/KAN-50/KAN-52/KAN-57

- **KAN-48** fija el artefacto canonico de fronteras y ACL: [`boundary-map-acl.md`](./boundary-map-acl.md).
- **KAN-49** (contratos/integraciones) solo puede ejecutar mecanismos marcados como `Permitida` o `Condicionada` en la matriz ACL y debe adjuntar evidencia de contrato.
- **KAN-50** (DB ownership/migracion RBAC) define estrategia de datos `managed=False` y plan incremental `expand -> migrate -> contract` sin cambios de runtime.
- **KAN-57** (runtime hardening) ejecuta enforcement de autorizacion en use cases/realtime manteniendo backend como source of truth.
- **KAN-52** (auditoria/trazabilidad) debe cumplir contrato minimo de evento de seguridad y evidencia de correlacion por `contextId/requestId`.
- **KAN-51** (request correlation) define contrato transversal `X-Request-ID` desde entrada HTTP hasta response/error payload para reconstruccion E2E por request.

### Estado KAN-49 (slice runtime inicial)

- Implementado slice inicial en `permissions-source-of-truth.md` con:
  - centralizacion backend de capabilities en un servicio unico,
  - migracion runtime acotada al flujo critico de recepcion,
  - consumo frontend del contrato canonico con `deny by default` cuando hay proyeccion backend,
  - evidencia de tests para deny/allow/punto unico de cambio.
- KAN-50 documenta la estrategia de ownership/migracion DB RBAC en [`rbac-db-ownership-migration-strategy.md`](./rbac-db-ownership-migration-strategy.md).
- El endurecimiento runtime de somatometria/realtime se traza en KAN-57 (fuera de alcance de KAN-50).
- KAN-51 documenta/implementa contrato de propagacion request-id en `request-id-traceability-contract.md`.

Regla operativa: cualquier implementacion KAN-49/KAN-50/KAN-52/KAN-57 que contradiga KAN-48 requiere decision previa registrada en `decision-log.md`.
