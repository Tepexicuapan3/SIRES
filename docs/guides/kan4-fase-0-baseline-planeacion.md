# KAN-4 - Fase 0 Baseline de Planeacion

> **TL;DR:** Antes de tocar codigo, todo agente debe validar este baseline. Si un ticket contradice estas reglas, se registra bloqueo. No se asume nada fuera de este documento + Jira.

**Fuente primaria:** `KAN-5`, `KAN-6`, `KAN-7`, `KAN-8`, `KAN-9`, `KAN-10`, `KAN-11`, `KAN-12`, `KAN-13`.

---

## 1) Alcance funcional congelado (KAN-5)

### In Scope v1

- Recepcion: registrar llegada (con cita/sin cita), gestionar cola, excepciones `cancelada` y `no_show`.
- Somatometria: captura de vitales minimos + IMC + liberacion a doctor.
- Doctor: diagnostico, nota final, receta basica, cierre de consulta.
- Flujo: maquina de estados v1 con auditoria.
- Seguridad: permisos por rol.

### Out of Scope v1

- Integraciones laboratorio/radiologia.
- Firma electronica avanzada.
- Notificaciones externas (SMS/WhatsApp/email).
- Inventario/dispensacion automatica.
- Triage avanzado y adjuntos multimedia.

---

## 2) Requerimientos FR/NFR (KAN-6)

### Funcionales criticos

- FR-01..FR-03: recepcion/cola.
- FR-04..FR-07: somatometria y paso a doctor.
- FR-08..FR-11: consulta medica y cierre.
- FR-12..FR-14: excepciones, auditoria y permisos.

### No funcionales criticos

- JWT HttpOnly + CSRF en mutaciones.
- RBAC obligatorio por accion.
- p95 de reflejo de estado en UI <= 5s.
- `X-Request-ID` en operaciones.
- Bloqueo de transiciones invalidas.
- Auditoria de acciones criticas.

---

## 3) Decisiones tecnicas cerradas (KAN-7)

- Backend Django/DRF por dominios (`recepcion`, `somatometria`, `consultas`).
- Regla de capas obligatoria: `view -> serializer -> use_case -> repository`.
- Maquina de estados centralizada en use_case (no logica de negocio en serializer/UI).
- Tiempo real con SSE y fallback polling.
- Frontend consume solo `api/resources` + TanStack Query.

---

## 4) Contratos y reglas (KAN-8)

### Endpoints v1 cerrados

- `POST /api/v1/visits`
- `GET /api/v1/visits`
- `PATCH /api/v1/visits/{visitId}/status`
- `POST /api/v1/visits/{visitId}/vitals`
- `POST /api/v1/visits/{visitId}/diagnosis`
- `POST /api/v1/visits/{visitId}/prescriptions`
- `POST /api/v1/visits/{visitId}/close`

### Envelope de error (obligatorio)

```json
{
  "code": "VALIDATION_ERROR",
  "message": "...",
  "status": 422,
  "requestId": "...",
  "details": {}
}
```

### Errores de dominio estandar

- `VISIT_STATE_INVALID` (409)
- `VITALS_INCOMPLETE` (422)
- `ROLE_NOT_ALLOWED` (403)
- `VISIT_NOT_FOUND` (404)
- `VALIDATION_ERROR` (422)
- `CONFLICT_DUPLICATE_ACTION` (409)

### Eventos de dominio minimos

- `VisitCreated`
- `VisitStatusChanged`
- `VitalsCompleted`
- `VisitReadyForDoctor`
- `VisitConsultationStarted`
- `VisitClosed`
- `VisitCancelled`
- `VisitNoShow`

---

## 5) UX/UI base (KAN-9)

Pantallas obligatorias:

- `RecepcionQueuePage`
- `SomatometriaCapturePage`
- `DoctorConsultationPage`
- `VisitTimelinePanel`

Estados UI obligatorios:

- loading, empty, error, success, disabled.

Mensajes de negocio obligatorios:

- "No se puede enviar a doctor: faltan signos vitales obligatorios."
- "No se puede cerrar consulta: falta diagnostico o nota final."
- "No tenes permiso para ejecutar esta accion."

---

## 6) DoR, DoD y calidad (KAN-10)

### DoR para implementar

- Alcance, FR/NFR, arquitectura, contratos y UX cerrados.
- Datos de prueba y permisos definidos.

### DoD por ticket

- Implementacion conforme arquitectura del repo.
- Pruebas del ticket en verde.
- Evidencia de QA.
- Criterios funcionales cumplidos.

---

## 7) Capacidad, ruta critica y riesgo (KAN-11, KAN-12, KAN-13)

- Deadline operativo del epic: `2026-02-20`.
- Ruta critica: contratos y estados -> implementacion vertical -> E2E + quality gates.
- David incorporado formalmente para ejecucion (`KAN-13`).
- Abel concentrado en FE/QA (`KAN-26`, `KAN-27`, `KAN-28`, `KAN-19`).

---

## Checklist de entrada para cualquier ticket de implementacion

- [ ] El ticket esta dentro de In Scope v1.
- [ ] Usa contratos y errores de `KAN-8`.
- [ ] Respeta estados v1 sin excepciones extra.
- [ ] Tiene pruebas definidas antes de implementar.
- [ ] Tiene gates de dependencia validados.

---

## Prompt base de validacion (copy/paste)

```text
Valida este ticket contra baseline KAN-4:
1) Alcance: esta dentro de In Scope v1?
2) Contrato: usa endpoints/campos/errores de KAN-8?
3) Estados: respeta la maquina de estados oficial?
4) Calidad: incluye pruebas y evidencia segun KAN-10?

Si algo falta o contradice baseline, responde BLOQUEADO y lista exactamente que dato falta.
```

---

## Referencias

- `docs/guides/kan4-implementacion-overview.md`
- `docs/guides/kan4-matriz-tickets-y-dependencias.md`
