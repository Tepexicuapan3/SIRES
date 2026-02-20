# WebSocket - Arquitectura Reusable para SIRES

> **TL;DR:** SIRES adopta WebSocket-first para tiempo real. Esta guia define un patron reutilizable (backend + frontend + QA) para no reinventar conexion, seguridad ni contrato de eventos en cada feature.

**Fecha creacion:** 2026-02-18  
**Ultima actualizacion:** 2026-02-18  
**Autor:** OpenCode

---

## Contexto y Problema

Las implementaciones de tiempo real ad-hoc tienden a romperse por tres causas:

1. Contratos de eventos inconsistentes.
2. Reconexion sin estrategia (duplicados, eventos perdidos, drift de estado).
3. Seguridad incompleta (auth parcial, origenes no validados, permisos por canal ausentes).

Para evitar deuda tecnica, esta guia define una base WebSocket reusable para KAN-4 y futuras features.

---

## Principios de diseno

1. **WebSocket-first:** tiempo real por canal persistente, no SSE.
2. **REST sigue vivo:** comandos y snapshot inicial/final por API HTTP.
3. **Contrato versionado:** todo evento lleva `version`, `eventType`, `sequence`.
4. **Seguridad por capas:** origen permitido + autenticacion + autorizacion por suscripcion.
5. **Resiliencia explicita:** reconexion con backoff + resincronizacion por gap.

---

## Arquitectura objetivo

### Backend (Django + Channels)

- ASGI con `ProtocolTypeRouter`.
- `AllowedHostsOriginValidator` para validar origen.
- Middleware de autenticacion para poblar `scope["user"]` desde cookie JWT HttpOnly.
- Channel layer con Redis (`channels_redis`).
- Publicacion por grupos (por visita, rol, clinica, etc.).

Ejemplo base (`asgi.py`):

```python
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

application = ProtocolTypeRouter(
    {
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(
                URLRouter([
                    # ws routes
                ])
            )
        )
    }
)
```

Config minima de channel layer:

```python
ASGI_APPLICATION = "config.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],
        },
    }
}
```

### Frontend (React + TS)

- Cliente WebSocket centralizado (`realtime client`), no sockets por componente.
- Registro de suscripciones por feature.
- Reconexion con exponential backoff + jitter.
- Dedupe y ordering por `eventId` + `sequence`.
- Resincronizacion via REST si se detecta gap.

---

## Contrato de evento estandar (obligatorio)

```json
{
  "eventId": "uuid",
  "eventType": "visit.status.changed",
  "entity": "visit",
  "entityId": "visitId",
  "version": 1,
  "occurredAt": "2026-02-18T12:30:00Z",
  "requestId": "req-123",
  "correlationId": "corr-123",
  "sequence": 1042,
  "payload": {}
}
```

Reglas:

- `eventType` semantico y estable (ej: `visit.status.changed`).
- `version` para evolucion de contrato sin romper clientes.
- `sequence` monotono por stream logico.
- `payload` sin datos sensibles innecesarios.

---

## Conexion, reconexion y consistencia

### Politica recomendada

- Handshake autenticado.
- Heartbeat app-level (si no hay trafico) para detectar half-open connections.
- Backoff exponencial con jitter (ej: 1s, 2s, 4s, 8s, max 30s).
- Al reconectar, validar continuidad por `sequence`.
- Si hay hueco de secuencia: hacer `resync` por REST (snapshot) y continuar stream.

### Regla anti-drift

Si el cliente detecta `sequence` no consecutivo:

1. Pausar render de eventos nuevos para ese stream.
2. Pedir snapshot por API.
3. Reanudar stream desde estado consistente.

---

## Seguridad (obligatoria)

1. `wss://` en ambientes no locales.
2. Validacion de `Origin` (allowlist).
3. Autenticacion por cookie HttpOnly/JWT en handshake.
4. Autorizacion por canal/grupo segun RBAC.
5. Cerrar conexion no autorizada con codigo explicito.
6. No enviar tokens en query string.

---

## Escalabilidad y operacion

- Redis como channel layer compartida.
- Group naming estable y valido (ASCII limitado, <= 100 chars en backend por defecto).
- Limites por mensaje y tamaño de payload.
- Logs estructurados con `requestId`/`correlationId`.
- Metricas: conexiones activas, reconnect rate, lag de eventos, drift incidents.

---

## Testing recomendado

### Backend

- Unit tests de consumer (auth, permisos, joins, leaves).
- Tests async con `WebsocketCommunicator`.
- Contract tests del envelope de eventos.

Ejemplo de test async:

```python
from channels.testing import WebsocketCommunicator

communicator = WebsocketCommunicator(app, "/ws/v1/visits/")
connected, _ = await communicator.connect()
assert connected
await communicator.disconnect()
```

### Frontend

- Test del cliente de conexion (reconnect, dedupe, resync trigger).
- Test de adapters de eventos por feature.

### E2E

- Validar que cambios de estado se reflejan en UI <= KPI.
- Validar reconexion en corte de red controlado.

---

## Estructura sugerida para reutilizar en toda la app

```text
backend/
  realtime/
    routing.py
    consumers/
      base.py
      visits.py
    auth.py
    schemas.py
    publisher.py

frontend/
  src/realtime/
    client.ts
    protocol.ts
    subscriptions.ts
    adapters/
      visits.ts
```

---

## Checklist de salida para cualquier feature realtime

- [ ] Usa cliente WebSocket compartido.
- [ ] Contrato de eventos versionado y documentado.
- [ ] Reconexion y resync probados.
- [ ] Autenticacion y autorizacion validadas.
- [ ] Sin drift de estado en pruebas E2E.

---

## Referencias

- `docs/guides/kan4-fase-3-consulta-y-tiempo-real.md`
- `docs/guides/kan4-fase-4-qa-y-release.md`
- Django Channels docs: https://channels.readthedocs.io/en/stable/
- MDN WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
