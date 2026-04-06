# KAN-69 - Observabilidad baseline auth-access

> TL;DR: Se instrumentó un baseline operativo mínimo para auth-access con métricas de login/policy-deny/auditoría/latencia, endpoint de snapshot y alertas iniciales listas para operación diaria.

## Contexto

KAN-69 solicita un entregable mínimo para tercera ola: habilitar observabilidad accionable (sin over-engineering), con señales orientadas a incidentes reales de autenticación/autorización.

## Métricas instrumentadas (3-5 core)

Las métricas se agregan en cache (`django.core.cache`) desde puntos críticos del dominio:

1. `authAccessLoginTotal`
   - Fuente: `LoginView`.
   - Labels: `success`, `fail`.
   - Uso operativo: detectar degradación de autenticación por ratio de fallas.

2. `authAccessPolicyDenyTotal`
   - Fuente: enforcement de policy deny (`RATE_LIMIT_EXCEEDED`, `ACCOUNT_LOCKED`, `SERVICE_UNAVAILABLE`).
   - Segmentación: `byCode` + `total`.
   - Uso operativo: detectar bloqueos de política y picos de denegación.

3. `authAccessAuditEventsTotal`
   - Fuente: `log_event` de auth y auditoría RBAC (`AuditService`).
   - Labels: `success`, `fail`.
   - Uso operativo: señal de salud de eventos sensibles auditables.

4. `authAccessEndpointLatencyMs`
   - Fuente: `LoginView` y `CapabilitiesView`.
   - Shape: por endpoint (`count`, `avgMs`, `maxMs`).
   - Uso operativo: latencia crítica sobre endpoints de acceso.

## Endpoint de consulta (tablero inicial)

- Ruta: `GET /api/v1/auth/ops/observability`
- Seguridad:
  - Requiere sesión autenticada.
  - Requiere permiso efectivo `*` o `admin:ops:observability:read`.
- Respuesta:
  - `generatedAt`
  - `metrics` (snapshot agregado)
  - `alerts` (evaluación con umbrales mínimos)

Ejemplo resumido:

```json
{
  "generatedAt": "2026-04-06T20:40:12.000000+00:00",
  "metrics": {
    "authAccessLoginTotal": {"success": 10, "fail": 3},
    "authAccessPolicyDenyTotal": {
      "total": 2,
      "byCode": {"RATE_LIMIT_EXCEEDED": 2}
    },
    "authAccessAuditEventsTotal": {"success": 35, "fail": 7},
    "authAccessEndpointLatencyMs": {
      "/auth/login": {"count": 13, "avgMs": 112.3, "maxMs": 482},
      "/auth/capabilities": {"count": 9, "avgMs": 41.8, "maxMs": 170}
    }
  },
  "alerts": []
}
```

## Alertas mínimas (documentadas y reproducibles)

1. `auth-access-login-failure-ratio` (High)
   - Trigger: `failureRatio >= 25%` con mínimo `5` intentos.
2. `auth-access-policy-deny-spike` (Medium)
   - Trigger: `policyDenyTotal >= 3`.
3. `auth-access-critical-latency` (High)
   - Trigger por endpoint crítico: `avgMs >= 350` o `maxMs >= 800`.

## Guía rápida de lectura para operación

1. Revisar `authAccessLoginTotal` y ratio de falla.
2. Si hay falla alta, inspeccionar `authAccessPolicyDenyTotal.byCode`.
3. Correlacionar con `authAccessAuditEventsTotal.fail` para confirmar impacto en trazabilidad.
4. Validar `authAccessEndpointLatencyMs` para detectar cuello de botella en login/capabilities.

## Evidencia mínima de emisión/consulta

- Emisión: login exitoso/fallido incrementa `authAccessLoginTotal`; denegaciones por policy incrementan `authAccessPolicyDenyTotal`; eventos auditados incrementan `authAccessAuditEventsTotal`.
- Consulta: endpoint `GET /api/v1/auth/ops/observability` devuelve snapshot agregada y alertas evaluadas.

## Archivos impactados

- `backend/apps/authentication/services/observability_service.py`
- `backend/apps/authentication/views.py`
- `backend/apps/authentication/urls.py`
- `backend/apps/authentication/services/audit_service.py`
- `backend/apps/administracion/services/audit_service.py`
- `backend/apps/authentication/tests/test_auth_observability_api.py`
