# auth-access - Plan de extracción de `rbac_views` por slices (KAN-52)

> TL;DR: KAN-52 define un plan **incremental y desplegable** para extraer `backend/apps/administracion/views/rbac_views.py` en slices de bajo riesgo, manteniendo compatibilidad legacy/nuevo y rollback por iteración.

## 1) Contexto y alcance

El archivo `rbac_views.py` concentra transporte HTTP, validaciones, autorización, auditoría y lógica operativa en un solo módulo de alta superficie. Esto incrementa riesgo de regresión y costo de mantenimiento.

### Alcance (IN)

- Inventario funcional de `rbac_views` por capacidad.
- Priorización de slices por riesgo/impacto/secuencia.
- Estrategia de coexistencia legacy/nuevo por slice.
- Criterios de corte y rollback explícitos por iteración.

### No alcance (OUT)

- Extracción completa en una sola entrega.
- Cambio de contratos HTTP públicos en este ticket.
- Replataformado de módulos no RBAC.

## 2) Inventario funcional actual (fuente runtime)

Rutas actuales en `backend/apps/administracion/urls.py` que dependen de `rbac_views`:

1. Roles
   - `GET/POST /roles`
   - `GET/PUT/DELETE /roles/{role_id}`
2. Catálogo y asignación de permisos
   - `GET /permissions`
   - `POST /permissions/assign`
   - `DELETE /permissions/roles/{role_id}/permissions/{permission_id}`
3. Usuarios RBAC
   - `GET/POST /users`
   - `GET/PATCH /users/{user_id}`
   - `PATCH /users/{user_id}/activate`
   - `PATCH /users/{user_id}/deactivate`
4. Asignaciones de rol por usuario
   - `POST /users/{user_id}/roles`
   - `PUT /users/{user_id}/roles/primary`
   - `DELETE /users/{user_id}/roles/{role_id}`
5. Overrides por usuario
   - `POST /users/{user_id}/overrides`
   - `DELETE /users/{user_id}/overrides/{code}`

## 3) Criterios de priorización

Se usa orden por:

1. **Riesgo de negocio** (impacto en autorización efectiva).
2. **Acoplamiento técnico** (dependencias internas de helpers compartidos).
3. **Frecuencia operativa** (rutas de mayor uso primero si son estables).
4. **Reversibilidad** (slices con rollback simple antes de mutaciones críticas).

## 4) Backlog de slices priorizado (ejecutable)

| Slice | Objetivo | Superficie principal | Riesgo | Dependencias |
|---|---|---|---|---|
| S0 Preparación | Aislar contrato transversal de request/auth/audit y baseline de pruebas de contrato | helpers `_authorize`, `_audit`, `_scope_error`, serialización común | Medio | KAN-49, KAN-51 |
| S1 Catálogo read-only | Extraer `GET /permissions` y `GET /roles`, `GET /roles/{id}` a módulo dedicado de lectura | consultas/serializadores read | Bajo | S0 |
| S2 Mutaciones de roles | Extraer `POST /roles`, `PUT/DELETE /roles/{id}` | validación + auditoría de rol | Medio | S1 |
| S3 Permisos por rol | Extraer asignación/revocación de permisos de rol | `POST /permissions/assign`, `DELETE .../permissions/...` | Alto | S2 |
| S4 Usuarios base | Extraer `GET/POST /users`, `GET/PATCH /users/{id}`, activate/deactivate | ciclo de vida usuario RBAC | Alto | S0 |
| S5 Roles por usuario | Extraer asignación de roles/primary/revoke por usuario | `/users/{id}/roles*` | Alto | S4 |
| S6 Overrides | Extraer alta/baja de overrides por usuario | `/users/{id}/overrides*` | Alto | S5 |

## 5) Estrategia de coexistencia legacy/nuevo

Durante extracción:

1. **Contrato HTTP inmutable por slice**
   - mismas rutas, payloads y códigos de error.
2. **Compatibilidad por delegación explícita**
   - capa de transporte mantiene endpoints actuales y delega a implementación legacy o nueva según slice.
3. **Sin acceso cross-domain nuevo**
   - se mantienen reglas de `boundary-map-acl.md` y `dependency-rules.md`.
4. **Auditoría mínima obligatoria**
   - todo slice mutante conserva contrato de auditoría (`actor`, `timestamp`, `action`, `domain`, `resource`, `result`, `contextId/requestId`, `beforeState/afterState` cuando aplique).

## 6) Criterios de corte por slice

Un slice se considera listo cuando cumple:

- [ ] Endpoints del slice responden igual que legacy en casos happy-path y error-path.
- [ ] Evidencia de compatibilidad de contrato (payload/códigos/requestId).
- [ ] Sin regresiones en pruebas del área afectada.
- [ ] Auditoría preservada para mutaciones.
- [ ] Documentación/changelog/decision-log actualizados.

## 7) Rollback por iteración

Si un slice genera incidente:

1. Revertir delegación del slice a implementación legacy previa.
2. Mantener rutas públicas sin cambios (evita impacto cliente).
3. Capturar incidente con `requestId/contextId` y evidencia de endpoint afectado.
4. Abrir ajuste puntual del slice antes de reintento.

Condición de rollback inmediato:

- aumento de errores 5xx en rutas del slice,
- ruptura de contrato observable por frontend,
- pérdida de auditoría en operaciones sensibles.

## 8) Dependencias y secuencia operativa

- Bloqueantes ya cerrados: `KAN-48` (boundary/ACL), `KAN-49` (source of truth permisos).
- Relación directa: `KAN-55` (TDD-first por riesgo) y `KAN-56` (slice piloto).
- Secuencia recomendada:
  1. Ejecutar S0 (preparación + baseline de contrato).
  2. Pilotear con S1 (read-only, menor riesgo).
  3. Escalar a slices mutantes (`S2+`) con evidencia TDD-first por riesgo.

## 9) Evidencia documental de KAN-52

Este ticket queda cerrado a nivel diseño/plan cuando exista:

- backlog de slices priorizado (sección 4),
- estrategia de coexistencia (sección 5),
- criterios de corte y rollback (secciones 6 y 7),
- secuencia de ejecución con dependencias explícitas (sección 8).

## 10) Referencias

- `docs/domains/auth-access/README.md`
- `docs/domains/auth-access/boundary-map-acl.md`
- `docs/domains/auth-access/backlog-mapping.md`
- `docs/domains/auth-access/permissions-source-of-truth.md`
- `docs/architecture/dependency-rules.md`
