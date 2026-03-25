# auth-access - RBAC DB Ownership & Migration Strategy (KAN-50)

> TL;DR: KAN-50 define estrategia de ownership y migracion de datos RBAC (`managed=False`) en fases `expand -> migrate -> contract`, con validaciones de integridad/concurrencia/rollback. El hardening runtime de autorizacion queda EXPLICITO en KAN-57.

## 1) Alcance y no-alcance (scope gate)

### Incluye (KAN-50)

- Estrategia de ownership de datos RBAC por dominio.
- Plan incremental de migracion DB para RBAC con `managed=False`.
- Criterios verificables por fase (integridad, consistencia, trazabilidad).
- Estrategia de concurrencia/idempotencia y rollback por fase.

### Fuera de alcance (KAN-57)

- Endurecimiento runtime de autorizacion (capability gates en use cases, realtime, frontend gating).
- Refactor de checks de permisos en codigo de aplicacion.
- Cambios de comportamiento de seguridad en tiempo de ejecucion.

## 2) Contexto canonico

- Politica base: `docs/architecture/db-ownership-migration-policy.md`.
- Reglas de dependencia: `docs/architecture/dependency-rules.md`.
- Mapa de contexto: `docs/architecture/context-map.md`.
- Mapa de dominios: `docs/architecture/domain-map.md`.

## 3) Ownership RBAC por dominio

| Activo de datos RBAC | Dominio owner | Tipo de ownership | Consumo permitido por otros dominios |
|---|---|---|---|
| Roles y permisos (`roles`, `permissions`) | `auth_access` | Escritura + evolucion de esquema | Solo via contratos de autorizacion (API/use case/evento), sin SQL directo |
| Asignaciones (`role_permissions`, `user_roles`) | `auth_access` | Escritura + evolucion de esquema | Lectura indirecta via servicio de autorizacion, sin acoplamiento a tablas |
| Metadata de migracion (`rbac_*_migration_state`) | `auth_access` | Operacional transitorio de migracion | Sin consumo cross-domain |

Regla dura: no se permite acceso directo cross-domain a tablas RBAC, aunque los modelos esten en el mismo engine PostgreSQL.

## 4) Plan incremental (expand -> migrate -> contract)

## Fase 1 - Expand

Objetivo: preparar estructura target y compatibilidad de lectura sin cortar legacy.

Entregables minimos:

- DDL target RBAC con constraints e indices definidos.
- Tablas/columnas de soporte para trazabilidad de migracion (`managed=False`).
- Scripts/queries de validacion de baseline (conteos y checksums por entidad).

Checkpoints verificables:

- [ ] Esquema target creado sin impacto funcional en runtime.
- [ ] Matriz de integridad aplicada (PK/FK/UNIQUE/nullability/indexes).
- [ ] Baseline de volumen y consistencia almacenado (snapshot versionado).

Rollback fase 1:

- Drop de estructuras nuevas no consumidas + restauracion de metadata de migracion.
- Sin rollback funcional porque no hay switch de lectura/escritura.

## Fase 2 - Migrate

Objetivo: mover datos legacy -> target en lotes idempotentes y auditables.

Entregables minimos:

- Jobs de backfill por lotes con marca de progreso.
- Reconciliacion por lote (conteo, hash deterministico, muestreo de FKs).
- Reporte de drift (faltantes, duplicados, orphan rows).

Checkpoints verificables:

- [ ] 100% de filas objetivo migradas o explicitamente excluidas con causa.
- [ ] Drift = 0 en entidades criticas (`roles`, `permissions`, `user_roles`, `role_permissions`).
- [ ] Evidencia de idempotencia: rerun del lote no altera resultado final.

Rollback fase 2:

- Revertir solo el lote activo usando marca de lote (`batch_id`) y tabla de control.
- Si se detecta drift severo, congelar nuevos lotes y volver a estado fase 1.

## Fase 3 - Contract

Objetivo: retirar artefactos legacy de datos RBAC ya migrados.

Entregables minimos:

- Congelamiento de escritura legacy y retiro controlado de objetos obsoletos.
- Validacion final post-contract (integridad + consultas de negocio criticas).
- Runbook de cierre con evidencia de rollback no requerido.

Checkpoints verificables:

- [ ] No quedan rutas de datos dependientes de estructura legacy RBAC.
- [ ] Constraints finales activas y sin excepciones temporales.
- [ ] Checklist de cierre firmado por owner DB + owner auth_access.

Rollback fase 3:

- Rehabilitar estructuras legacy solo si existe evidencia de regresion de datos.
- Reversar contract en ventana controlada con snapshot previo obligatorio.

## 5) Matriz de integridad minima (RBAC)

| Entidad | PK | FK | UNIQUE | Nullability | Indices minimos |
|---|---|---|---|---|---|
| `roles` | `id` | - | `code` | `code` NOT NULL, `name` NOT NULL | `idx_roles_code` |
| `permissions` | `id` | - | `code` | `code` NOT NULL | `idx_permissions_code` |
| `role_permissions` | (`role_id`,`permission_id`) | `role_id -> roles.id`, `permission_id -> permissions.id` | compuesto PK/UNIQUE | ambos NOT NULL | `idx_role_permissions_permission_id` |
| `user_roles` | (`user_id`,`role_id`) | `role_id -> roles.id` | compuesto PK/UNIQUE | ambos NOT NULL | `idx_user_roles_role_id`, `idx_user_roles_user_id` |

Notas:

- Si existe soft-delete, debe incluirse constraint/indice parcial para evitar duplicados activos.
- Cualquier excepcion de integridad debe documentarse con vencimiento y owner.

## 6) Operaciones criticas y controles

| Operacion | Riesgo | Control requerido |
|---|---|---|
| Alta/edicion de rol | colision de codigos | UNIQUE + transaccion corta |
| Asignacion masiva de permisos a rol | duplicados y bloqueos | upsert idempotente por lote + chunking |
| Reasignacion de roles a usuarios | orphans/lecturas inconsistentes | FK estricta + orden transaccional (rol antes de relacion) |
| Backfill de migracion | drift o re-ejecucion insegura | idempotency key + reconciliacion por lote |

## 7) Concurrencia e idempotencia

- Locking: usar `SELECT ... FOR UPDATE` solo en filas objetivo del lote activo.
- Versionado: mantener `updated_at`/`version` para detectar write conflicts en tablas de asignacion.
- Idempotencia: cada job de migracion debe registrar `job_id` + `batch_id` + `checksum`.
- Reintentos: permitidos solo si el lote anterior quedo en estado terminal (`failed`/`completed`).

## 8) Riesgos y mitigaciones

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| Drift entre legacy y target | permisos incorrectos en datos | reconciliacion por lote + corte por umbral de error |
| Locks prolongados en tablas de asignacion | degradacion operativa | lotes chicos + ventanas controladas + timeout de lock |
| Duplicados por reruns | inconsistencia de RBAC | upsert idempotente y UNIQUE compuestas |
| Mezcla de alcance con runtime hardening | retrabajo y confusion Jira | scope gate explicito KAN-50 vs KAN-57 en cada artefacto |

## 9) Checklist de validacion por fase (ejecutable)

- [ ] Fase 1 Expand: esquema target + constraints + snapshot baseline.
- [ ] Fase 2 Migrate: backfill completo + drift=0 + evidencia idempotente.
- [ ] Fase 3 Contract: retiro legacy + validacion post-contract + cierre de owners.
- [ ] Trazabilidad actualizada en `README.md`, `backlog-mapping.md`, `decision-log`, `changelog`.
- [ ] Separacion de alcance validada: KAN-50 (DB) != KAN-57 (runtime).

## 10) TDD-first documental para ejecucion tecnica posterior

### RED (tests que deben fallar primero)

- [ ] Test de integridad: detectar ausencia de PK/FK/UNIQUE esperadas en target RBAC.
- [ ] Test de migracion: detectar drift entre conteo legacy y target por entidad.
- [ ] Test de idempotencia: rerun de lote produce cambios cuando no deberia.

### GREEN (implementacion minima)

- [ ] Aplicar DDL/constraints/indices hasta pasar tests de integridad.
- [ ] Implementar backfill + reconciliacion por lote hasta drift=0.
- [ ] Implementar control `job_id`/`batch_id` para reruns seguros.

### REFACTOR (sin cambiar comportamiento)

- [ ] Simplificar queries de validacion y unificar formato de reporte.
- [ ] Optimizar tamano de lote/indices sin alterar resultados funcionales.
- [ ] Consolidar runbooks/checklists para operacion repetible.

Regla: cualquier excepcion a TDD-first debe quedar justificada en Jira/PR con controles compensatorios.

## References

- `docs/architecture/db-ownership-migration-policy.md`
- `docs/architecture/dependency-rules.md`
- `docs/architecture/context-map.md`
- `docs/architecture/domain-map.md`
- `docs/domains/auth-access/backlog-mapping.md`
