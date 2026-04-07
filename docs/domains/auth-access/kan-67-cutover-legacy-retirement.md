# KAN-67 - Cutover incremental + retiro controlado legacy (`rbac_views`)

> TL;DR: Se ejecutó un corte puntual de bajo blast radius en el segmento **S3 (permisos por rol)** para retirar lógica legacy inline de `rbac_views.py` y delegarla a adaptadores dedicados, manteniendo fallback por flag y contrato HTTP inmutable.

## 1) Segmento legacy afectado

Segmento retirado de `rbac_views.py`:

- `AssignRolePermissionsView.post` (branch legacy inline)
- `RevokeRolePermissionView.delete` (branch legacy inline)

Ahora ambos endpoints delegan a:

- `rbac_role_permission_views.py` cuando `RBAC_ROLE_PERMISSION_S3_ENABLED=true` (source `s3`)
- `rbac_role_permission_legacy_views.py` cuando `RBAC_ROLE_PERMISSION_S3_ENABLED=false` (source `legacy`)

## 2) Justificación del corte

- Blast radius acotado al slice S3.
- Sin cambios de ruta ni payload.
- Sin cambios de schema/datos.
- Reduce deuda técnica en `rbac_views.py` sin eliminar fallback de emergencia.

## 3) Contrato y datos (seguridad de operación)

- Contrato HTTP preservado para:
  - `POST /api/v1/permissions/assign`
  - `DELETE /api/v1/permissions/roles/{roleId}/permissions/{permissionId}`
- Persistencia intacta: se mantienen `use_cases` existentes para asignación/revocación (sin rutas nuevas de datos).
- No se introducen accesos cross-domain.

## 4) Rollback explícito

Rollback inmediato del cutover:

1. Configurar `RBAC_ROLE_PERMISSION_S3_ENABLED=false`.
2. Redeploy backend.
3. Verificar auditoría de endpoints S3 con `meta.source="legacy"`.

## 5) Evidencia de no-regresión

- Se añadieron tests explícitos de source por flag para S3:
  - `test_assign_role_permissions_records_legacy_source_when_flag_disabled`
  - `test_revoke_permission_records_legacy_source_when_flag_disabled`
- Se conservaron tests de source `s3` con flag habilitado.

## Referencias

- `docs/domains/auth-access/rbac-views-extraction-slices-plan.md`
- `docs/domains/auth-access/kan-58a-s2-apply-evidence.md`
- `docs/api/modules/rbac.md`
