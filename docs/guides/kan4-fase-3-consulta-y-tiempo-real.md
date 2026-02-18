# KAN-4 - Fase 3 Consulta Medica y Tiempo Real

> **TL;DR:** Esta fase habilita el tramo doctor y la sincronizacion de estados en tiempo real. Es la fase con mayor riesgo de acoplamiento, por eso el orden de gates es estricto.

**Tickets de fase:** `KAN-22`, `KAN-17`, `KAN-20`

---

## Objetivo de la fase

Completar la experiencia de consulta medica (backend + frontend) con SSE/fallback estable para mantener consistencia de estado entre roles.

---

## Orden obligatorio de ejecucion

1. `KAN-22` - SSE y fallback (base de sincronizacion).
2. `KAN-17` - APIs de diagnostico, receta y cierre.
3. `KAN-20` - UI doctor y cierre de consulta.

Dependencias criticas:

- `KAN-22` depende de `KAN-18`, `KAN-21`, `KAN-28`.
- `KAN-17` depende de `KAN-16`, `KAN-24`, `KAN-25`, `KAN-22`.
- `KAN-20` depende de `KAN-17`, `KAN-22`, `KAN-26`.

---

## Especificacion por ticket

### KAN-22 - Notificaciones SSE y fallback (owner: Victor, due: 2026-02-18)

Debe cubrir:

- Emision backend de eventos de dominio.
- Consumo FE de eventos en cola/somatometria/consulta.
- Fallback polling cada 15s cuando SSE falle.
- Reconexion controlada sin drift de estado.

KPI requerido:

- Reflejo de estado p95 <= 5s (percibido).

### KAN-17 - APIs consulta/receta/cierre (owner: David, due: 2026-02-18)

Debe cubrir:

- `POST /api/v1/visits/{visitId}/diagnosis`
- `POST /api/v1/visits/{visitId}/prescriptions`
- `POST /api/v1/visits/{visitId}/close`

Obligatorio:

- No cerrar sin `primaryDiagnosis` + `finalNote`.
- Auditoria de acciones criticas.
- Idempotencia razonable en reintentos.

### KAN-20 - UI doctor (owner: Luis, due: 2026-02-18)

Debe cubrir:

- `DoctorConsultationPage` + `VisitTimelinePanel`.
- Formularios de diagnostico, nota clinica y receta.
- Bloqueo de cierre si faltan campos obligatorios.
- Mensajes de negocio alineados con `KAN-9`.

---

## Criterios de salida de fase

- [ ] `KAN-22` estable con pruebas de reconexion/fallback.
- [ ] `KAN-17` cierra consulta solo con reglas correctas.
- [ ] `KAN-20` refleja bloqueos y errores de dominio sin ambiguedad.
- [ ] Flujo `lista_para_doctor -> en_consulta -> cerrada` consistente en BE y FE.

---

## Riesgos y plan de contencion

1. **Riesgo:** atraso en `KAN-22`.
   - **Impacto:** bloquea `KAN-17`, `KAN-20`, `KAN-19`.
   - **Accion:** prioridad maxima a fallas de SSE/fallback.

2. **Riesgo:** cierre de consulta sin validaciones completas.
   - **Impacto:** inconsistencia clinica.
   - **Accion:** tests de guard clause obligatorios antes de merge.

3. **Riesgo:** drift entre estado backend y UI.
   - **Impacto:** errores operativos en flujo real.
   - **Accion:** verificar eventos y fallback en escenarios de red inestable.

---

## Prompt de ejecucion (copy/paste)

```text
Ejecuta Fase 3 de KAN-4:

Orden estricto: KAN-22 -> KAN-17 -> KAN-20.
No cierres KAN-17 sin validar guard clause de cierre.
No cierres KAN-20 sin pruebas de UI/hook en verde.

Entrega:
1) Evidencia SSE/fallback estable.
2) Evidencia de reglas clinicas de cierre.
3) Evidencia de consistencia de estado BE/FE.
```

---

## Referencias

- `docs/guides/kan4-fase-2-implementacion-recepcion-somatometria.md`
- `docs/guides/kan4-fase-4-qa-y-release.md`
- `docs/guides/kan4-matriz-tickets-y-dependencias.md`
