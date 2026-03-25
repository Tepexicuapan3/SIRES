# auth-access - X-Request-ID Traceability Contract (KAN-51)

> TL;DR: `X-Request-ID` queda definido como contrato transversal en auth-access: preserva header entrante, genera UUID cuando falta y lo devuelve en response/header y payload de error para correlación E2E.

## 1) Alcance KAN-51

Incluye:

- Contrato de propagación `X-Request-ID` para runtime Django/DRF.
- Preservación de request-id entrante en rutas auth-access.
- Generación automática de request-id cuando no llega header.
- Exposición del request-id en:
  - header de respuesta `X-Request-ID`,
  - payload de error estándar (`requestId`),
  - metadata/auditoría cuando las rutas ya registran eventos.

No incluye:

- Replataformado completo de observabilidad.
- Trazabilidad E2E de dominios fuera de auth-access.
- Rediseño de contratos de auditoría fuera del mínimo vigente.

## 2) Contrato técnico

## 2.1 Reglas

1. Si la request trae `X-Request-ID`, **se preserva** en todo el flujo.
2. Si la request no trae header, middleware **genera UUID v4** y lo adjunta al request.
3. Toda respuesta HTTP incluye `X-Request-ID`.
4. Todo `error_response` incluye `requestId` cuando existe `request.request_id`.

## 2.2 Matriz de propagación

| Etapa | Componente | Regla de propagación |
|---|---|---|
| Entrypoint HTTP | Django request (`META`/headers) | Lee `X-Request-ID` entrante o deja vacío para generación. |
| Middleware | `apps.administracion.middleware.request_id.RequestIDMiddleware` | Preserva header o genera UUID; setea `request.request_id`; expone `response["X-Request-ID"]`. |
| Capa de aplicación/use case | Views/use cases que llaman `get_request_id(request)` | Obtienen id desde `request.request_id` (fuente primaria) y lo propagan a auditoría/eventos/error_response. |
| Response | `apps.authentication.services.response_service.error_response` + middleware | `requestId` en payload de error y `X-Request-ID` en header de respuesta. |

## 3) Rutas críticas

Cubiertas en esta iteración KAN-51:

- `POST /api/v1/auth/login` (preserva/genera/devuelve request-id).

Cobertura transversal impactada por contrato (sin barrido exhaustivo de endpoints en este ticket):

- Cualquier view que ya use `get_request_id(request)` en `authentication`, `recepcion`, `somatometria`, `consulta_medica`, `administracion`.

Pendientes explícitos:

- Barrido de verificación endpoint por endpoint para evidencia completa de cobertura en todo auth-access.
- Correlación obligatoria request-id en reportes operativos agregados (KAN-52).

## 4) Evidencia técnica

- Middleware registrado globalmente en `backend/config/settings.py`.
- Fallback canónico en `backend/apps/authentication/services/response_service.py`.
- Pruebas:
  - `backend/apps/authentication/tests/test_auth_core_services.py`
  - `backend/apps/authentication/tests/test_auth_api.py`

## 5) Criterio operativo de troubleshooting

Para investigar incidentes de auth-access:

1. Tomar `X-Request-ID` desde respuesta frontend o error backend.
2. Buscar el mismo id en eventos auditables/logs de flujo.
3. Reconstruir secuencia endpoint -> autorización -> resultado con ese correlativo.

## 6) Referencias

- `docs/domains/auth-access/README.md`
- `docs/domains/auth-access/boundary-map-acl.md`
- `docs/domains/auth-access/permissions-source-of-truth.md`
- `docs/domains/auth-access/backlog-mapping.md`

## 7) Trazabilidad Engram obligatoria (KAN-51)

Para cumplimiento operativo de SIRES, este cambio debe registrarse en Engram con:

- `project: SIRES_SHARED`
- `topic_key: feature/kan-51-request-id/decision`
- `topic_key: feature/kan-51-request-id/progress`

Campos minimos esperados en cada registro:

- **What**: contrato aplicado o avance implementado.
- **Why**: motivo de trazabilidad E2E/auditoria operativa.
- **Where**: archivos backend/docs impactados.
- **Learned**: riesgos, limites y siguientes pasos (si aplica).
