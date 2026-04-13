# auth-access - Boundary Map + ACL tecnico (KAN-48)

> TL;DR: artefacto canonico de fronteras e integraciones permitidas para `auth_access`, con matriz ACL verificable y guardrails de ejecucion para KAN-49/KAN-50/KAN-52/KAN-57, sin cambios de runtime en KAN-48.

## 1) Contexto y objetivo

KAN-48 define el marco documental para evitar acoplamientos cross-domain y establecer una politica operativa unica de integracion para `auth_access`.

- **Ticket**: KAN-48
- **Dominio**: `auth_access`
- **Tipo**: governance documental (sin cambios de runtime)
- **Precondicion**: baseline AS-IS completado en [`baseline-as-is.md`](./baseline-as-is.md) (KAN-47)

## 2) Alcance / no alcance

### Alcance

- Definir boundary map operativo del dominio `auth_access`.
- Definir ACL tecnica de integraciones con estado `permitida | condicionada | prohibida`.
- Definir contratos formales permitidos (`query`, `service`, `event`) para inter-domain communication.
- Dejar guardrails ejecutables para tickets dependientes KAN-49/KAN-50/KAN-52/KAN-57.
- Consolidar trazabilidad AC KAN-48 -> evidencia documental.

### No alcance

- No refactor de modulos backend/frontend.
- No cambios de endpoints ni contratos runtime actuales.
- No migraciones DB ni cambios de schema.
- No cambios de CI/CD ni build.

## 3) Source-of-truth y precedencia

Para evitar ambiguedad entre documentos, la precedencia canonica del dominio queda asi:

1. **Reglas globales de arquitectura y operacion**: [`AGENTS.md`](../../../AGENTS.md), [`docs/README.md`](../../README.md).
2. **Requerimientos funcionales del dominio**: [`prd.md`](./prd.md).
3. **Estado tecnico actual (AS-IS)**: [`baseline-as-is.md`](./baseline-as-is.md).
4. **Boundary + ACL tecnico (este documento)**: `boundary-map-acl.md`.
5. **Ejecucion y trazabilidad**: [`backlog-mapping.md`](./backlog-mapping.md), [`decision-log.md`](./decision-log.md), [`changelog.md`](./changelog.md).

Regla: si hay conflicto entre PRD y este documento sobre limites de integracion, **se prioriza este documento para enforcement tecnico** y se abre decision en `decision-log.md`.

## 4) Boundary map de `auth_access`

### 4.1 Actores del dominio

| Actor | Tipo | Interaccion principal con `auth_access` |
|---|---|---|
| Usuario final autenticable | Humano | Login, renovacion de sesion, recovery, onboarding, logout |
| Admin RBAC | Humano | Gestion de roles/permisos/asignaciones/overrides |
| Frontend SISEM | Sistema interno | Consumidor de APIs de auth/rbac y aplicacion de gating UX |
| Servicios backend SISEM (otros dominios) | Sistema interno | Consulta/validacion por contratos autorizados |
| Auditoria/Compliance | Actor de control | Consulta de trazabilidad de eventos de acceso |

### 4.2 Vecinos de dominio y relacion esperada

| Dominio vecino | Relacion con `auth_access` | Mecanismo permitido por defecto |
|---|---|---|
| `clinical-*` (dominios clinicos) | Consume identidad/permisos para decisiones de acceso | Query/service contract |
| `catalogs` | Fuente de catalogos RBAC segun baseline actual | Service contract versionado |
| `admin-rbac` (estado AS-IS dentro de administracion) | Gestion de asignaciones/permisos | Orquestacion controlada + eventos internos |
| `audit` (capacidad transversal) | Registro de eventos criticos de acceso | Domain events internos + append-only store |

### 4.3 Fronteras permitidas

- Uso de **contratos explicitos** (`query`, `service`, `event`) versionados y testeables.
- Orquestacion inter-domain solo via **use case de aplicacion** (no desde capa de transporte).
- Publicacion de eventos para side-effects con consistencia eventual cuando corresponda.
- Autorizacion resuelta en backend como source of truth (frontend solo UX gating).

### 4.4 Fronteras prohibidas

- Acceso directo a tablas/modelos/repositorios internos de otro dominio.
- Reutilizacion de entities/modelos internos de `auth_access` fuera de contratos.
- Dependencias circulares entre modulos de dominio.
- Regla de conveniencia prohibida: “ya que estamos en el mismo monolito, hago join directo”.

## 5) Matriz ACL tecnica de integraciones

> Estados ACL:
> - **Permitida**: se puede implementar sin excepcion, cumpliendo condiciones base.
> - **Condicionada**: requiere precondiciones verificables y evidencia.
> - **Prohibida**: bloqueada por politica; requiere rediseño, no waiver informal.

| Integracion | Estado ACL | Condiciones verificables | Evidencia minima |
|---|---|---|---|
| Dominio X -> `auth_access` via `GET /auth/me` o contrato equivalente de sesion | Permitida | contrato versionado + timeout/retry definidos + manejo de error estandar | `docs/api/modules/auth.md` + pruebas de contrato |
| Dominio X -> validacion de permiso atomico via servicio de autorizacion | Permitida | permiso atomico explicito + politica centralizada + backend decision final | `docs/api/modules/rbac.md` + test de policy |
| `auth_access` -> dominio vecino mediante evento interno | Condicionada | evento con `contextId/requestId`, `actor`, `timestamp`, `result` + idempotencia del consumidor | especificacion de evento + prueba de consumo idempotente |
| Dominio X -> tablas `sy_usuarios`, `rel_usuario_roles`, `rel_usuario_overrides` por SQL directo | Prohibida | N/A | falla de review (anti-pattern explicito) |
| Dominio X -> importar repository/model internals de `authentication/administracion` | Prohibida | N/A | falla de review de dependencias |
| Frontend -> evaluacion de permisos para UX gating | Permitida | nunca reemplaza autorizacion backend + fallback deny en ausencia de sesion | guard/tests de ruta + validacion backend |
| Frontend -> decisiones security-critical sin validacion backend | Prohibida | N/A | falla de AC/DoD |
| Realtime para control de acceso core | Condicionada | justificacion de negocio + canal/auth/mensaje estandar + no persistencia primaria de auditoria | ADR/RFC + contrato de canal |

## 6) Catalogo de contratos permitidos

### 6.1 Query contract (lectura deterministica)

Uso: obtener estado de sesion, identidad proyectada o permisos efectivos.

Campos minimos del contrato:

- `requestId` / `contextId`
- `subjectId` (usuario objetivo)
- `effectivePermissions` (cuando aplique)
- `authRevision` (cuando aplique)
- `issuedAt` / `expiresAt` (cuando aplique)

### 6.2 Service contract (comando sincrono)

Uso: operaciones de login/logout/refresh/recovery o cambios RBAC con respuesta inmediata.

Condiciones:

- validacion CSRF para mutaciones
- auditoria obligatoria en operaciones sensibles
- codigos de error estandarizados y trazables por `requestId`

### 6.3 Event contract (side-effects desacoplados)

Uso: notificar eventos de seguridad/acceso sin acoplar dominios por dependencia directa.

Campos minimos:

- `eventType`
- `timestamp`
- `actor`
- `domain = auth_access`
- `resource`
- `result`
- `contextId/requestId`
- `beforeState` / `afterState` (si hay mutacion)

## 7) Anti-patrones explicitos (bloqueantes)

1. SQL cross-domain directo entre ownerships de dominio.
2. Reusar modelos/repositorios internos como “API informal”.
3. Resolver autorizacion con role strings hardcodeados en views/componentes.
4. Mover logica critica de acceso a capa de transporte/UI.
5. Escribir auditoria en tablas transaccionales no append-only.
6. Introducir realtime para CRUD core de autorizacion sin justificacion formal.

## 8) Guardrails de ejecucion para KAN-49, KAN-50, KAN-52, KAN-57

> Estos guardrails son criterios de implementacion obligatorios para tickets dependientes.

### KAN-49 (implementacion de contratos/consumo entre dominios)

- Toda integracion nueva debe mapearse a una fila de la ACL de la seccion 5.
- No se aprueba implementacion sin contrato documentado (`query` o `service`) y evidencia de test de contrato.
- Si surge necesidad fuera de ACL permitida, abrir decision previa en `decision-log.md`.

### KAN-50 (DB ownership/migracion RBAC `managed=False`)

- Definir ownership explicito de activos RBAC por dominio owner (`auth_access`).
- Ejecutar plan incremental `expand -> migrate -> contract` con checkpoints verificables.
- Prohibido incluir cambios de comportamiento runtime en este ticket.

### KAN-57 (endurecimiento runtime de autorizacion y enforcement)

- Politicas de autorizacion centralizadas; prohibido check ad-hoc por rol.
- Backend decide siempre; frontend solo refleja experiencia (gating UX).
- Debe existir evidencia de `deny by default` y manejo de conflictos (`deny-overrides`).

### KAN-52 (plan de extraccion incremental de `rbac_views`)

- Definir backlog de slices priorizado por riesgo/impacto para `rbac_views`.
- Asegurar estrategia de coexistencia legacy/nuevo por slice sin romper contratos HTTP.
- Definir criterio de corte y rollback por iteracion antes de ejecutar slices mutantes.

## 9) Mapeo AC KAN-48 -> evidencia

| AC KAN-48 | Evidencia (ruta) |
|---|---|
| AC-01 Artefacto canonico boundary map + ACL creado | `docs/domains/auth-access/boundary-map-acl.md` |
| AC-02 Contexto, alcance/no-alcance y precedencia definidos | Secciones 1, 2 y 3 de este documento |
| AC-03 Boundary map con actores/vecinos/fronteras permitidas-prohibidas | Seccion 4 |
| AC-04 Matriz ACL tecnica con condiciones verificables | Seccion 5 |
| AC-05 Catalogo de contratos permitidos (query/service/event) | Seccion 6 |
| AC-06 Anti-patrones explicitos de integracion | Seccion 7 |
| AC-07 Guardrails para KAN-49/KAN-50/KAN-52/KAN-57 | Seccion 8 + `backlog-mapping.md` |
| AC-08 Discoverability actualizada en indices | `docs/domains/auth-access/README.md`, `docs/README.md` |
| AC-09 Trazabilidad documental actualizada | `docs/domains/auth-access/changelog.md`, `decision-log.md`, `backlog-mapping.md` |
| AC-10 DoD verificable y riesgos/mitigaciones documentados | Secciones 10 y 11 |

## 10) DoD KAN-48 (checklist verificable)

- [x] Existe documento canonico `boundary-map-acl.md` en `docs/domains/auth-access/`.
- [x] Incluye contexto, alcance/no alcance y precedencia de source-of-truth.
- [x] Incluye boundary map con actores, vecinos y fronteras permitidas/prohibidas.
- [x] Incluye matriz ACL tecnica con estado y condiciones verificables.
- [x] Incluye catalogo de contratos permitidos (`query/service/event`).
- [x] Incluye anti-patrones bloqueantes.
- [x] Incluye guardrails operativos para KAN-49/KAN-50/KAN-52/KAN-57.
- [x] Incluye matriz AC KAN-48 -> evidencia por ruta.
- [x] Se enlaza en `docs/domains/auth-access/README.md`.
- [x] Se enlaza en `docs/README.md`.
- [x] Se registra trazabilidad en `changelog.md` y `decision-log.md`.

## 11) Riesgos y mitigaciones

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| ACL queda declarativa pero no se aplica en tickets siguientes | Medio/Alto | Guardrails obligatorios en seccion 8 + dependencia explicita en `backlog-mapping.md` |
| Reaparicion de acoplamientos por urgencia operativa | Alto | Anti-patrones bloqueantes + gate de review arquitectonica |
| Divergencia entre PRD y enforcement tecnico | Medio | Regla de precedencia + registro de decisiones obligatorio |
| Ambiguedad sobre alcance de auditoria | Medio | Contrato minimo de evento + checklist DoD verificable |

## 12) Traceability (Engram)

- **Project**: `SISEM_SHARED`
- **Topic keys recomendados**:
  - `feature/dominio-1-acceso/decision`
  - `docs/auth-access/boundary-acl/note`
- **Eventos de captura esperados**:
  - Aceptacion y cierre documental de KAN-48 (boundary map + ACL vigente).
  - Cambios de estado/condiciones en la matriz ACL (seccion 5).
  - Cambios de dependencia o guardrails vinculados a KAN-49/KAN-50/KAN-52/KAN-57.

## 13) Referencias

- [`README.md`](./README.md)
- [`overview.md`](./overview.md)
- [`prd.md`](./prd.md)
- [`baseline-as-is.md`](./baseline-as-is.md)
- [`backlog-mapping.md`](./backlog-mapping.md)
- [`decision-log.md`](./decision-log.md)
- [`../../README.md`](../../README.md)
- [`../../../AGENTS.md`](../../../AGENTS.md)
