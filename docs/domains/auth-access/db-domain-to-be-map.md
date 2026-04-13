# auth-access - DB Domain TO-BE Map (KAN-103 Batch 1)

> TL;DR: este mapa define el objetivo TO-BE de ownership de datos para Auth-Access, resolviendo el ownership disperso AS-IS y fijando la secuencia `expand -> migrate -> contract` para S1/S2 (KAN-107/KAN-106).

## Contexto y alcance

- Ticket paraguas: **KAN-103** (plan DB-domain map).
- Batch 1: **S1 + S2** (trazabilidad de ejecución **KAN-107** y **KAN-106**).
- Objetivo: explicitar fronteras de datos Auth-Access sin tocar runtime ni contratos API en este batch.

## Mapa AS-IS vs TO-BE por entidades/tablas

| Grupo | Tabla/Entidad | Owner AS-IS | Owner TO-BE | Clasificación | Fase sugerida |
|---|---|---|---|---|---|
| Identidad | `sy_usuarios`, `det_usuarios` | `apps.authentication` | `auth_access` | **keep** (dominio) | expand + migrate |
| RBAC catálogo | `cat_roles`, `cat_permisos` | `apps.catalogos` | `auth_access` | **move** | expand + migrate + contract |
| RBAC asignaciones | `rel_usuario_roles`, `rel_rol_permisos`, `rel_usuario_overrides` | `apps.administracion` | `auth_access` | **move** | expand + migrate + contract |
| Auditoría de acceso | `auditoria_eventos` (subset auth/rbac) | `apps.administracion` | `auth_access_audit` (scope acotado a auth/rbac) | **split** | expand + migrate + contract |
| Referencia externa | `cat_centros_atencion` | `apps.catalogos` | `catalogos` (sin cambio) | **consume-by-contract** | expand (contrato) |

## Decisiones de frontera cross-domain

1. **Auth-Access no consume SQL directo cross-domain** para catálogos no propios (ej. centros de atención); consume contrato API/read-model.
2. **RBAC atómico (roles/permisos/asignaciones)** pasa a ownership TO-BE de Auth-Access para eliminar doble ownership `catalogos` + `administracion`.
3. **Auditoría** se separa por responsabilidad: eventos auth/rbac bajo ownership de Auth-Access; otros eventos operativos permanecen fuera del dominio.
4. Se preserva baseline de plataforma: PostgreSQL compartido con aislamiento lógico estricto en fase actual.

## Riesgos principales y mitigación

| Riesgo | Impacto | Mitigación en Batch 1 |
|---|---|---|
| Drift de ownership entre docs y ejecución | Planes incompatibles entre equipos | Mapa único TO-BE + actualización de `domain-map` e `incremental-domain-migration` |
| Acoplamiento accidental a tablas de `catalogos`/`administracion` | Violación de reglas cross-domain | Clasificación explícita `consume-by-contract` y `move` por grupo |
| Ambigüedad de auditoría compartida | Trazabilidad incompleta o mezclada | Decisión explícita de `split` con scope auth/rbac |

## Notas de implementación por fase

- **expand**: declarar ownership TO-BE, contratos y estructuras objetivo sin cortar legado.
- **migrate**: backfill y reconciliación por grupo (conteos/checksum/drift=0 en entidades críticas).
- **contract**: retiro controlado de estructuras legacy no owner, con rollback documentado por lote.

## Trazabilidad

- **KAN-103**: marco de planificación de DB-domain map.
- **KAN-107**: definición de mapa TO-BE + clasificación por grupo (S1).
- **KAN-106**: resolución de contradicción documental de estado y alineación de trackers (S2).

## Referencias

- `docs/domains/auth-access/baseline-as-is.md`
- `docs/domains/auth-access/rbac-db-ownership-migration-strategy.md`
- `docs/architecture/domain-map.md`
- `docs/guides/incremental-domain-migration.md`
- `docs/architecture/db-ownership-migration-policy.md`
