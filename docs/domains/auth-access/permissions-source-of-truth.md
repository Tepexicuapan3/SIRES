# auth-access - Permissions Source of Truth (KAN-49)

> TL;DR: este slice de KAN-49 consolida la evaluacion de permisos efectivos/capabilities en backend como fuente canonica y fuerza `deny by default` en consumo frontend cuando la proyeccion backend existe, acotado al flujo critico de recepcion.

## 1) Alcance del slice KAN-49

Incluye solo el minimo runtime obligatorio para cerrar la primera porcion de KAN-49:

- Backend: punto unico de evaluacion de capabilities (`authorization_service`) reutilizado por el flujo critico de recepcion.
- Frontend: gating UX de flujo critico consumiendo capabilities del contrato backend canonico sin fallback inseguro.
- Testing: evidencia de `deny by default`, `allow` con permiso efectivo y prueba de punto unico de cambio.

Fuera de alcance en este slice:

- Reescritura total de todos los checks historicos de permisos.
- Migracion completa de todos los feature modules a `requiredCapability` puro.
- Migracion del use case de somatometria (`capture_vitals_usecase`) a capability enforcement runtime.

## 2) Contrato canonico de permisos (backend -> frontend)

### 2.1 Payload canonico en `AuthUser`

Campos relevantes:

- `permissions: string[]` -> permisos otorgados directos (role + overrides).
- `effectivePermissions: string[]` -> permisos realmente efectivos luego de dependencias.
- `capabilities: Record<string, { granted: boolean; missingAllOf: string[]; missingAnyOf: string[] }>` -> evaluacion canonica por capacidad.
- `permissionDependenciesVersion: string` -> version del motor de proyeccion (`v1` en este slice).
- `strictCapabilityPrefixes: string[]` -> prefijos de capability en modo estricto para frontend transicional.

### 2.2 Semantica

- Backend es source of truth de autorizacion.
- Si falta capability o requisito en backend, el resultado es `granted: false` (`deny by default`).
- Frontend usa capabilities solo para UX gating; no decide seguridad real.

### 2.3 Modo transicional KAN-49 (compat strategy)

Para evitar regresion en modulos no migrados y mantener backend como source of truth en el alcance migrado:

- `strictCapabilityPrefixes` define los ambitos en modo estricto (`deny by default` si capability no viene en `capabilities`).
- En este slice de KAN-49 los prefijos estrictos activos son:
  - `flow.recepcion.`
  - `flow.visits.`
- `flow.somatometria.` queda documentado como pendiente para siguiente slice (KAN-50/KAN-52).
- Para capabilities fuera de esos prefijos, frontend puede aplicar fallback legacy temporal (si se provee `fallbackRequirement`) para preservar UX en modulos no migrados.
- Este fallback NO reemplaza seguridad backend: cualquier accion real sigue validando permisos/capabilities en backend.

### 2.4 Errores esperados en flujos protegidos

Contrato de error standard (`error_response`):

- `code`
- `message`
- `status`
- `timestamp`
- `requestId` (si aplica)

Codigos observables en este slice para autorizacion:

- `ROLE_NOT_ALLOWED` (dominio operativo/flujo critico)
- `PERMISSION_DENIED` (CSRF o acceso denegado por capa de seguridad)

## 3) Legacy -> Target (slice incremental)

| Estado | Legacy | Target KAN-49 slice |
|---|---|---|
| Resolucion de permisos/capabilities | Dependencias y checks dispersos entre use cases + fallback frontend | Servicio backend central (`backend/apps/authentication/services/authorization_service.py`) + consumo canonico en frontend |
| Autorizacion de flujo critico recepcion | Bypass por role string (`RECEPCION`) | Evaluacion por capability canonica (`flow.recepcion.queue.write`, `flow.visits.queue.read`) |
| Autorizacion de flujo critico somatometria | Bypass por role string (`SOMATOMETRIA`) | Pendiente de migracion de use case para siguiente slice (KAN-50/KAN-52) |
| UX fallback | Fallback local aunque backend tenga proyeccion | Modo hibrido: `deny by default` solo para prefijos estrictos KAN-49 + fallback legacy temporal en capabilities no migradas |

## 4) AC KAN-49 -> evidencia

| AC KAN-49 | Evidencia |
|---|---|
| 1) Acciones protegidas autorizadas desde backend (sin logica dispersa) | `backend/apps/authentication/services/authorization_service.py`, `backend/apps/recepcion/uses_case/visit_queue_usecase.py` |
| 2) Frontend consume contrato canonico | `frontend/src/features/auth/queries/usePermissionDependencies.ts` (sin fallback inseguro con proyeccion backend), `frontend/src/test/unit/auth/usePermissionDependencies.test.ts` |
| 3) Regla critica con punto unico de cambio + prueba | `backend/apps/authentication/tests/test_authorization_service.py::test_single_change_point_updates_runtime_behavior` |
| 4) Somatometria runtime migration | Fuera de alcance en KAN-49; pendiente para KAN-50/KAN-52 o siguiente slice de migracion |

## 5) Riesgos y limites del slice

Riesgos residuales:

- Existen todavia checks heredados fuera de este flujo critico que no migraron al servicio central.
- `capture_vitals_usecase` mantiene enforcement por role string en este ticket para respetar boundary/ownership vigente.
- `ROLE_NOT_ALLOWED` se mantiene como codigo de error de dominio para compatibilidad de contrato, aunque la decision ya es por capability.

Limites:

- No hay deprecacion total de helpers legacy de dependencia local en frontend.
- No se completo el barrido global de todas las rutas protegidas en backend/apps.

## 6) Recomendaciones inmediatas (KAN-50 / KAN-52)

- KAN-50: extender `authorization_service` como policy gateway unico en todos los use cases criticos y eliminar checks por role string remanentes.
- KAN-52: amarrar decision de autorizacion con evento de auditoria estandarizado por capability evaluada + `requestId/contextId`.
