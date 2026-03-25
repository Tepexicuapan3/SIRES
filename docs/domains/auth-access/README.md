# Dominio auth-access

Hub canonico del Dominio 1 de SIRES.

## Alcance del dominio

Este dominio cubre:

- Autenticacion
- Identidad
- Autorizacion
- Recuperacion de acceso
- Trazabilidad/auditoria de acceso

## Navegacion

- [`overview.md`](./overview.md) - contexto, limites y principios operativos del dominio.
- [`prd.md`](./prd.md) - PRD formal del dominio (fuente funcional principal).
- [`baseline-as-is.md`](./baseline-as-is.md) - baseline tecnico versionado AS-IS (KAN-47) para trazabilidad y desbloqueo de KAN-48+.
- [`boundary-map-acl.md`](./boundary-map-acl.md) - boundary map + ACL tecnico canonico de `auth_access` (KAN-48) con guardrails para KAN-49/KAN-50/KAN-52.
- [`permissions-source-of-truth.md`](./permissions-source-of-truth.md) - slice runtime minimo de KAN-49 para consolidar backend source of truth de permisos efectivos/capabilities.
- [`pending-decisions.md`](./pending-decisions.md) - pendientes criticos de negocio/compliance para cierre.
- [`backlog-mapping.md`](./backlog-mapping.md) - mapeo entre PRD y backlog de ejecucion (Jira/SDD).
- [`decision-log.md`](./decision-log.md) - registro de decisiones del dominio.
- [`changelog.md`](./changelog.md) - historial de cambios documentales del dominio.

## Regla anti-duplicidad

Este `README.md` funciona como hub. El detalle vive en los documentos tematicos para evitar duplicacion.

## Estado de migracion

- Fuente canonica actual: `docs/domains/auth-access/*`.
- Rutas legacy de referencia (deprecadas):
  - `docs/guides/prd-dominio-1-auth-access.md`
  - `docs/guides/prd-dominio-1-auth-access-pendientes-reunion.md`
