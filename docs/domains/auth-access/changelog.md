# auth-access - Changelog

## 2026-03-23 (KAN-49 slice runtime)

- Se agrega `permissions-source-of-truth.md` como artefacto canonico de fuente unica de permisos/capabilities para KAN-49.
- Se documenta contrato canonico backend->frontend (`permissions`, `effectivePermissions`, `capabilities`, `permissionDependenciesVersion`) y semantica `deny by default`.
- Se registra mapeo AC KAN-49 -> evidencia por rutas runtime/tests/docs.
- Se explicita que la migracion runtime de somatometria queda fuera de este ticket (pendiente para KAN-50/KAN-52 o siguiente slice).

## 2026-03-23

- Se crea la estructura canonica `docs/domains/auth-access/`.
- Se migra PRD desde `docs/guides/prd-dominio-1-auth-access.md` a `docs/domains/auth-access/prd.md`.
- Se migra guia de pendientes desde `docs/guides/prd-dominio-1-auth-access-pendientes-reunion.md` a `docs/domains/auth-access/pending-decisions.md`.
- Se agregan `overview.md`, `backlog-mapping.md`, `decision-log.md` y `README.md` como base de governance documental del dominio.
- Se mantiene compatibilidad con stubs legacy en `docs/guides/` (deprecados).
- Se agrega `baseline-as-is.md` como baseline tecnico versionado AS-IS del dominio para KAN-47.
- Se agrega `boundary-map-acl.md` como artefacto canonico de Boundary Map + ACL tecnico del dominio para KAN-48.
- Se actualizan indices de discoverability en `docs/domains/auth-access/README.md` y `docs/README.md`.
- Se registra cierre documental de baseline en `decision-log.md`.
- Se registra decision de aceptacion de KAN-48 en `decision-log.md` y dependencia explicita KAN-48 -> KAN-49/KAN-50/KAN-52 en `backlog-mapping.md`.
