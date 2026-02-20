# KAN-4 - Matriz de Tickets y Dependencias

> **TL;DR:** Mapa operativo unico para ejecutar `KAN-14`..`KAN-35` sin saltar gates. Si hay diferencia con Jira, gana Jira.

**Snapshot de estado:** 2026-02-18

---

## Planeacion cerrada (referencia)

| Ticket | Tema | Estado | Due |
|---|---|---|---|
| KAN-5 | Alcance y objetivos | Finalizado | 2026-02-13 |
| KAN-6 | FR/NFR | Finalizado | 2026-02-13 |
| KAN-7 | Arquitectura | Finalizado | 2026-02-16 |
| KAN-8 | Contratos API/eventos/datos | Finalizado | 2026-02-17 |
| KAN-9 | UX/UI flujo E2E | Finalizado | 2026-02-13 |
| KAN-10 | Testing DoR/DoD | Finalizado | 2026-02-17 |
| KAN-11 | Estimacion y roadmap | Finalizado | 2026-02-19 |
| KAN-12 | Ownership por equipo | Finalizado | 2026-02-13 |
| KAN-13 | Alta/ajuste de ownership | Finalizado | 2026-02-19 |

---

## TDD, Arquitectura Realtime e Implementacion

| Ticket | Tipo | Owner | Estado | Due | Bloqueado por | Desbloquea |
|---|---|---|---|---|---|---|
| KAN-23 | TDD-BE dominio/estados | Luis | Finalizado | 2026-02-16 | - | KAN-14, KAN-16, KAN-17, KAN-18 |
| KAN-24 | TDD-BE contratos recepcion | Luis | Finalizado | 2026-02-16 | KAN-23 | KAN-14, KAN-17 |
| KAN-25 | TDD-BE contratos somatometria | Luis | Finalizado | 2026-02-16 | KAN-23 | KAN-18, KAN-17, KAN-28 |
| KAN-26 | TDD-FE flujo UI | Luis | Finalizado | 2026-02-17 | KAN-24, KAN-25 | KAN-15, KAN-20, KAN-21, KAN-28, KAN-34 |
| KAN-14 | IMPL-BE recepcion/cola | Victor | Finalizado | 2026-02-17 | KAN-16, KAN-23, KAN-24 | KAN-15, KAN-18, KAN-19 |
| KAN-16 | IMPL-BE base clinica/estados | Victor | En curso | 2026-02-19 | KAN-23 | KAN-14, KAN-17, KAN-18 |
| KAN-21 | IMPL-FE UI somatometria | Luis | En curso | 2026-02-19 | KAN-18, KAN-26 | KAN-22, KAN-19 |
| KAN-28 | TDD-BE/FE WebSocket contracts | Luis | En curso | 2026-02-19 | KAN-25, KAN-26 | KAN-22, KAN-19, KAN-34, KAN-35 |
| KAN-35 | ARCH-BE WebSocket reusable | Victor | Por hacer | 2026-02-19 | KAN-28 | KAN-22 |
| KAN-34 | ARCH-FE cliente WebSocket reusable | Luis | Por hacer | 2026-02-19 | KAN-26, KAN-28 | KAN-22, KAN-20 |
| KAN-22 | IMPL-BE/FE WebSocket realtime | Victor | En curso | 2026-02-19 | KAN-18, KAN-21, KAN-28, KAN-34, KAN-35 | KAN-17, KAN-20, KAN-19 |
| KAN-15 | IMPL-FE recepcion/cola | Luis | Por hacer | 2026-02-20 | KAN-14, KAN-26 | KAN-19 |
| KAN-17 | IMPL-BE consulta/receta/cierre | David | Por hacer | 2026-02-20 | KAN-16, KAN-24, KAN-25, KAN-22 | KAN-20, KAN-19 |
| KAN-18 | IMPL-BE somatometria | Victor | Por hacer | 2026-02-20 | KAN-16, KAN-23, KAN-25, KAN-14 | KAN-21, KAN-22, KAN-19 |
| KAN-20 | IMPL-FE UI doctor | Luis | Por hacer | 2026-02-20 | KAN-17, KAN-22, KAN-26 | KAN-19 |
| KAN-27 | TDD-QA smoke + gate | Luis | Por hacer | 2026-02-23 | KAN-26, KAN-28 | KAN-19 |
| KAN-19 | IMPL-QA suite E2E + gates | Luis | Por hacer | 2026-02-23 | KAN-14,15,17,18,20,21,22,26,27,28 | Cierre tecnico KAN-4 |

---

## Criterios de evidencia por tipo de ticket

### TDD-BE / TDD-FE / TDD-QA

- Pruebas en rojo inicial (evidencia).
- Pruebas en verde final (evidencia CI/local).
- Lista de casos limite cubiertos.

### ARCH-BE / ARCH-FE (WebSocket reusable)

- Contrato de evento versionado documentado.
- Cliente/infra reusable sin codigo duplicado por feature.
- Reconexion, ordering y resync validados.

### IMPL-BE

- Endpoints conformes a contrato `KAN-8`.
- Errores normalizados.
- Permisos por rol validados.
- Trazabilidad con `requestId`.

### IMPL-FE

- Consumo desde `api/resources`.
- Pruebas de componente/hook.
- Mensajes UX alineados a `KAN-9`.

### IMPL-QA

- Gate de pipeline activo.
- Artefactos E2E y reporte final.

---

## Orden recomendado por gates (estado actual)

1. Cerrar `KAN-16`, `KAN-21`, `KAN-28`.
2. Ejecutar `KAN-35` + `KAN-34` para habilitar base reusable.
3. Completar `KAN-22` con gates completos.
4. Ejecutar `KAN-17` + `KAN-20`.
5. Cerrar `KAN-15`, `KAN-18`, `KAN-27`.
6. Ejecutar `KAN-19` y cerrar epic.

---

## Regla operativa final

Si el ticket que vas a ejecutar no tiene todas sus dependencias en estado listo, la respuesta correcta es:

```text
BLOQUEADO
Ticket: <KEY>
Dependencia faltante: <KEY>
Motivo: gate no cumplido
```

---

## Referencias

- `docs/guides/kan4-implementacion-overview.md`
- `docs/guides/kan4-fase-1-tdd-fundaciones.md`
- `docs/guides/kan4-fase-2-implementacion-recepcion-somatometria.md`
- `docs/guides/kan4-fase-3-consulta-y-tiempo-real.md`
- `docs/guides/kan4-fase-4-qa-y-release.md`
- `docs/guides/websocket-arquitectura-reusable.md`
