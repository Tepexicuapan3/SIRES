# KAN-4 - Remediacion de Tickets Cerrados tras Pivot WebSocket

> **TL;DR:** Este backlog identifica tickets que aparecen como cerrados pero quedaron parcialmente desactualizados tras el cambio de arquitectura `SSE/fallback -> WebSocket-first reusable`.

---

## Contexto

El pivot a WebSocket-first impacto definiciones de arquitectura, contratos de eventos y criterios de calidad.
Por eso, algunos tickets cerrados necesitan reapertura o ticket delta para evitar falso cierre.

Regla operativa:

- Reabrir ticket cuando cambio contrato/comportamiento funcional.
- Crear ticket delta cuando falta hardening, evidencia o coverage adicional sin cambiar el objetivo original.

---

## Tickets cerrados impactados

| Ticket | Estado actual | Impacto por pivot | Accion recomendada | Prioridad |
|---|---|---|---|---|
| `KAN-8` | Finalizado | El baseline ya referencia contratos/eventos y el detalle WebSocket v1 se movio a `KAN-28` + guias de fase. | **Mantener cerrado** + comentario de trazabilidad | Media |
| `KAN-10` | Finalizado | El baseline de DoR/DoD sigue valido; los gates realtime detallados se ejecutan en `KAN-27`, `KAN-28`, `KAN-19`. | **Mantener cerrado** + comentario de trazabilidad | Media |
| `KAN-14` | Finalizado | Transiciones de recepcion deben emitir eventos de dominio consistentes para realtime; falta evidencia consolidada de publicacion para stream WebSocket. | **Ticket delta** | Alta |
| `KAN-26` | Finalizado | Flujo FE base esta listo, pero falta evidencia de resiliencia de hooks/UI al stream WebSocket real (ordering, dedupe, resync). | **Ticket delta** | Media |

Notas:

- `KAN-7` ya fue actualizado para WebSocket-first en planeacion; no requiere accion adicional si su descripcion en Jira ya refleja el pivot.
- `KAN-23`, `KAN-24`, `KAN-25` mantienen validez como base TDD de dominio/contrato HTTP.

---

## Tickets delta creados en Jira

## 1) [ENHANCEMENT] Backfill eventos realtime desde recepcion (API)

**Key:** `KAN-36`  
**Team:** API  
**Bloqueado por:** `KAN-28`  
**Bloquea:** `KAN-22`, `KAN-19`

### Description

Completar la emision de eventos de dominio de recepcion para que el canal WebSocket tenga continuidad de stream sin huecos funcionales.

**Current State:**

- `KAN-14` esta cerrado con foco HTTP/cola.
- No hay evidencia consolidada de emision de todos los eventos necesarios para realtime WebSocket.

**Expected State:**

- Cada transicion de recepcion relevante publica evento versionado compatible con envelope v1.
- El stream soporta trazabilidad (`requestId`, `correlationId`) y secuencia monotona.

### Acceptance Criteria

- [ ] Se publican eventos en transiciones de recepcion (`VisitCreated`, `VisitStatusChanged` y equivalentes definidos en `KAN-8`).
- [ ] Cada evento cumple envelope v1 (incluyendo `sequence`, `requestId`, `correlationId`, `version`).
- [ ] Hay pruebas automatizadas de publicacion de eventos por caso feliz y edge case.
- [ ] Hay evidencia de compatibilidad con consumidores de `KAN-22`.

### Testing

- [ ] Unit tests de publisher/event mapper en verde.
- [ ] Integration test de transicion -> evento publicado.

---

## 2) [ENHANCEMENT] Endurecer pruebas FE realtime en flujo clinico (UI)

**Key:** `KAN-37`  
**Team:** UI  
**Bloqueado por:** `KAN-34`, `KAN-28`  
**Bloquea:** `KAN-20`, `KAN-19`

### Description

Agregar cobertura FE para asegurar comportamiento correcto ante reconexion, duplicados y huecos de secuencia en stream WebSocket.

**Current State:**

- `KAN-26` cubre flujo UI base, pero no toda la resiliencia de canal realtime.

**Expected State:**

- Hooks/paginas de recepcion, somatometria y consulta responden bien a reconnect/dedupe/resync.

### Acceptance Criteria

- [ ] Tests de hooks validan reconexion con backoff exponencial.
- [ ] Tests validan dedupe de `eventId` y ordering por `sequence`.
- [ ] Ante gap detectado, UI dispara resincronizacion por API y recupera consistencia.
- [ ] No hay llamadas HTTP directas desde componentes fuera de `api/resources`.

### Testing

- [ ] Vitest en verde para hooks realtime.
- [ ] Smoke de UI con eventos simulados en verde.

---

## Textos listos para Jira (copy/paste)

### Comentario para `KAN-8`

```text
Trazabilidad post-pivot WebSocket-first:

KAN-8 se mantiene en Done porque su objetivo de baseline contractual sigue vigente.
El detalle operativo de contrato realtime (envelope v1, sequence, ordering, resync) se ejecuta en KAN-28 y guias de fase.

No se reabre KAN-8. Cualquier gap de implementacion se maneja por tickets delta (KAN-36/KAN-37).
```

### Comentario para `KAN-10`

```text
Trazabilidad post-pivot WebSocket-first:

KAN-10 se mantiene en Done porque DoR/DoD base no cambia.
Los criterios tecnicos realtime (handshake, reconexion, dedupe, ordering, resync) quedan exigidos por KAN-27, KAN-28 y KAN-19.

No se reabre KAN-10. Los gaps de ejecucion se corrigen con tickets delta.
```

### Comentario para `KAN-14`

```text
KAN-14 permanece en Done por alcance original (APIs recepcion/cola).
Por pivot WebSocket-first se abre ticket delta KAN-36 para completar hardening de eventos realtime sin reabrir este ticket.
```

### Comentario para `KAN-26`

```text
KAN-26 permanece en Done por alcance original (TDD UI base).
Por pivot WebSocket-first se abre ticket delta KAN-37 para resiliencia realtime (dedupe/ordering/resync) sin reabrir este ticket.
```

### Comentario para `KAN-4`

```text
Remediacion post-pivot SSE/fallback -> WebSocket-first:

1) KAN-8 y KAN-10 se mantienen cerrados con trazabilidad.
2) Se crean deltas KAN-36 (API) y KAN-37 (UI) para cerrar gaps de KAN-14/KAN-26.
3) KAN-22, KAN-20 y KAN-19 quedan condicionados a salida de KAN-36/KAN-37 segun matriz actualizada.
```

---

## Checklist de verificacion en Jira

1. Confirmar comentario en `KAN-8` y `KAN-10` aclarando trazabilidad y no reapertura.
2. Confirmar `KAN-36` creado como delta API y trazabilidad de dependencias con `KAN-22` y `KAN-19`.
3. Confirmar `KAN-37` creado como delta UI y trazabilidad de dependencias con `KAN-20` y `KAN-19`.
4. Confirmar comentario de resumen en `KAN-4` con referencias a `KAN-36` y `KAN-37`.

---

## Referencias

- `docs/guides/kan4-matriz-tickets-y-dependencias.md`
- `docs/guides/kan4-fase-3-consulta-y-tiempo-real.md`
- `docs/guides/websocket-arquitectura-reusable.md`
