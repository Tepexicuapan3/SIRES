# KAN-4 - Fase 2 Implementacion Recepcion y Somatometria

> **TL;DR:** Esta fase construye el primer vertical funcional (recepcion + somatometria) en backend y frontend, usando los contratos ya validados en TDD.

**Tickets de fase:** `KAN-14`, `KAN-18`, `KAN-15`, `KAN-21`, `KAN-26`, `KAN-28`

---

## Objetivo de la fase

Entregar el flujo operativo desde llegada de paciente hasta liberacion a doctor, con reglas de negocio y UX consistentes.

---

## Secuencia recomendada

1. `KAN-26` (TDD FE flujo UI) y `KAN-28` (TDD SSE/fallback) cuando `KAN-24` y `KAN-25` ya esten estables.
2. `KAN-14` backend recepcion/cola.
3. `KAN-18` backend somatometria.
4. `KAN-15` frontend recepcion.
5. `KAN-21` frontend somatometria.

Notas de gate:

- `KAN-15` depende de `KAN-14` + `KAN-26`.
- `KAN-21` depende de `KAN-18` + `KAN-26`.
- `KAN-22` (fase 3) depende de `KAN-18` + `KAN-21` + `KAN-28`.

---

## Especificacion por ticket

### KAN-14 - APIs de recepcion/cola (owner: Victor, due: 2026-02-17)

Debe cubrir:

- `POST /api/v1/visits`
- `GET /api/v1/visits`
- `PATCH /api/v1/visits/{visitId}/status` para `cancelada` y `no_show`

Obligatorio:

- RBAC por rol recepcion.
- `X-Request-ID` y errores normalizados.

### KAN-18 - APIs de somatometria (owner: Victor, due: 2026-02-17)

Debe cubrir:

- `POST /api/v1/visits/{visitId}/vitals`
- IMC server-side.
- Bloqueo de pase a doctor con vitales incompletos.

Obligatorio:

- Error `VITALS_INCOMPLETE` probado.
- Evento `VitalsCompleted`.

### KAN-26 - TDD UI de flujo (owner: Abel, due: 2026-02-17)

Debe cubrir:

- Estados loading/empty/error/success.
- Bloqueos de acciones invalidas.
- Validaciones de formularios criticos.

### KAN-15 - UI recepcion (owner: Luis, due: 2026-02-17)

Debe cubrir:

- `RecepcionQueuePage` + formulario llegada + acciones `cancelada/no_show`.
- Consumo exclusivo desde `api/resources`.

### KAN-21 - UI somatometria (owner: Luis, due: 2026-02-19)

Debe cubrir:

- `SomatometriaCapturePage`.
- Validaciones en tiempo real + visualizacion IMC.
- Manejo UX de `VITALS_INCOMPLETE`.

### KAN-28 - TDD SSE/fallback (owner: Abel, due: 2026-02-17)

Debe cubrir:

- handshake SSE,
- reconexion,
- fallback sin perdida/duplicidad de eventos.

---

## Criterios de salida de fase

- [ ] Recepcion funciona end-to-end (BE+FE) con permisos y errores correctos.
- [ ] Somatometria funciona end-to-end (BE+FE) con validacion clinica.
- [ ] UI usa solo recursos API y no HTTP directo en componentes.
- [ ] TDD FE y TDD SSE dejan base lista para fase 3.

---

## Checklist anti-errores

- [ ] No hay endpoints fuera de `KAN-8`.
- [ ] No hay nuevos codigos de error inventados.
- [ ] No se rompe la maquina de estados.
- [ ] Se registran pruebas de rol no autorizado.
- [ ] Se conserva accesibilidad minima definida en `KAN-9`.

---

## Prompt de ejecucion (copy/paste)

```text
Ejecuta Fase 2 de KAN-4 (recepcion + somatometria):

1) Usa contratos y errores de KAN-8.
2) Respeta gates entre KAN-14, KAN-18, KAN-15, KAN-21, KAN-26, KAN-28.
3) No permitas HTTP directo en componentes FE.
4) Entrega evidencia de pruebas por ticket.

Si falta una dependencia, responde BLOQUEADO con ticket exacto y gate faltante.
```

---

## Referencias

- `docs/guides/kan4-fase-1-tdd-fundaciones.md`
- `docs/guides/kan4-fase-3-consulta-y-tiempo-real.md`
- `docs/guides/kan4-matriz-tickets-y-dependencias.md`
