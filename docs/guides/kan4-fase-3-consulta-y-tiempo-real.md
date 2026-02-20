# KAN-4 - Fase 3 Consulta Medica y Tiempo Real

> **TL;DR:** Esta fase habilita consulta medica y sincronizacion en tiempo real con enfoque WebSocket-first. Es la fase con mayor riesgo de acoplamiento, por eso el orden de gates es estricto.

**Tickets de fase:** `KAN-22`, `KAN-17`, `KAN-20`  
**Habilitadores transversales:** `KAN-34`, `KAN-35`

---

## Objetivo de la fase

Completar la experiencia de consulta medica (backend + frontend) con WebSocket estable para mantener consistencia de estado entre roles.

---

## Orden obligatorio de ejecucion

1. `KAN-22` - Infra y capa de eventos WebSocket (base de sincronizacion).
2. `KAN-17` - APIs de diagnostico, receta y cierre.
3. `KAN-20` - UI doctor y cierre de consulta.

Dependencias criticas:

- `KAN-22` depende de `KAN-18`, `KAN-21`, `KAN-28`, `KAN-34`, `KAN-35`.
- `KAN-17` depende de `KAN-16`, `KAN-24`, `KAN-25`, `KAN-22`.
- `KAN-20` depende de `KAN-17`, `KAN-22`, `KAN-26`.

---

## Especificacion por ticket

### KAN-22 - Notificaciones WebSocket (owner: Victor, due: 2026-02-19)

Debe cubrir:

- Endpoint WebSocket autenticado para eventos de visitas.
- Emision backend de eventos de dominio versionados.
- Consumo FE de eventos en cola/somatometria/consulta.
- Reconexion con backoff y resincronizacion de estado por API cuando haya gap.

Obligatorio:

- Seguridad de conexion: `AllowedHostsOriginValidator` + autenticacion por cookie JWT HttpOnly.
- Sin token sensible en query string.
- Evento con envelope estable (tipo, version, correlation, requestId, payload).

KPI requerido:

- Reflejo de estado p95 <= 5s (percibido).

### KAN-17 - APIs consulta/receta/cierre (owner: David, due: 2026-02-20)

Debe cubrir:

- `POST /api/v1/visits/{visitId}/diagnosis`
- `POST /api/v1/visits/{visitId}/prescriptions`
- `POST /api/v1/visits/{visitId}/close`

Obligatorio:

- No cerrar sin `primaryDiagnosis` + `finalNote`.
- Auditoria de acciones criticas.
- Publicar eventos de dominio para consumidores WebSocket.
- Idempotencia razonable en reintentos.

### KAN-20 - UI doctor (owner: Luis, due: 2026-02-20)

Debe cubrir:

- `DoctorConsultationPage` + `VisitTimelinePanel`.
- Formularios de diagnostico, nota clinica y receta.
- Bloqueo de cierre si faltan campos obligatorios.
- Suscripcion WebSocket para refresco de estado y timeline en tiempo real.

### KAN-34 / KAN-35 - Arquitectura reusable (due: 2026-02-19)

Debe cubrir:

- `KAN-35`: bootstrap backend reusable (routing, consumers base, publisher, envelope).
- `KAN-34`: cliente FE compartido (connect/reconnect, ordering, dedupe, resync).

Obligatorio:

- `KAN-22` no se considera listo sin outputs de ambos tickets.

---

## Contrato de eventos (minimo v1)

Todos los eventos WebSocket deben usar envelope comun:

```json
{
  "eventId": "uuid",
  "eventType": "visit.status.changed",
  "entity": "visit",
  "entityId": "visitId",
  "version": 1,
  "occurredAt": "2026-02-18T12:30:00Z",
  "requestId": "req-...",
  "correlationId": "corr-...",
  "sequence": 1042,
  "payload": {}
}
```

Reglas:

- `eventType` versionable y estable.
- `sequence` monotono por stream para detectar huecos.
- Si hay hueco de secuencia, FE debe resincronizar por API.

---

## Criterios de salida de fase

- [ ] `KAN-22` estable con pruebas de handshake, reconexion y ordering.
- [ ] `KAN-17` cierra consulta solo con reglas correctas y emite eventos.
- [ ] `KAN-20` refleja bloqueos y errores de dominio sin ambiguedad.
- [ ] Flujo `lista_para_doctor -> en_consulta -> cerrada` consistente en BE y FE.

---

## Riesgos y plan de contencion

1. **Riesgo:** atraso en `KAN-22`.
   - **Impacto:** bloquea `KAN-17`, `KAN-20`, `KAN-19`.
   - **Accion:** prioridad maxima a estabilidad de canal WebSocket.

2. **Riesgo:** cierre de consulta sin validaciones completas.
   - **Impacto:** inconsistencia clinica.
   - **Accion:** tests de guard clause obligatorios antes de merge.

3. **Riesgo:** drift entre estado backend y UI.
   - **Impacto:** errores operativos en flujo real.
   - **Accion:** detectar gap por `sequence` y disparar resincronizacion controlada.

---

## Prompt de ejecucion (copy/paste)

```text
Ejecuta Fase 3 de KAN-4:

Orden estricto: KAN-22 -> KAN-17 -> KAN-20.
No cierres KAN-22 sin evidencia de handshake/reconexion/ordering.
No cierres KAN-17 sin validar guard clause de cierre y emision de eventos.
No cierres KAN-20 sin pruebas de UI/hook en verde.

Entrega:
1) Evidencia WebSocket estable.
2) Evidencia de reglas clinicas de cierre.
3) Evidencia de consistencia de estado BE/FE.
```

---

## Referencias

- `docs/guides/websocket-arquitectura-reusable.md`
- `docs/guides/kan4-fase-2-implementacion-recepcion-somatometria.md`
- `docs/guides/kan4-fase-4-qa-y-release.md`
- `docs/guides/kan4-matriz-tickets-y-dependencias.md`
