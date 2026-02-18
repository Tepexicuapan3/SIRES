# KAN-4 - Fase 4 QA Final y Release Gate

> **TL;DR:** Esta fase define el gate final. Sin smoke E2E, quality gates y evidencia completa, no se cierra `KAN-4`.

**Tickets de fase:** `KAN-27`, `KAN-19`

---

## Objetivo de la fase

Validar de punta a punta el flujo critico y bloquear merges/release si aparece regresion en contrato, UI o E2E.

---

## Orden de ejecucion

1. `KAN-27` - Smoke E2E + quality gate inicial.
2. `KAN-19` - Suite E2E completa + gate final de pipeline.

Dependencias:

- `KAN-27` depende de `KAN-26` y `KAN-28`.
- `KAN-19` depende de `KAN-14`, `KAN-15`, `KAN-17`, `KAN-18`, `KAN-20`, `KAN-21`, `KAN-22`, `KAN-26`, `KAN-27`, `KAN-28`.

---

## Especificacion por ticket

### KAN-27 (owner: Abel, due: 2026-02-18)

Debe cubrir:

- Smoke E2E del camino feliz completo:
  - recepcion -> somatometria -> doctor -> cierre.
- Pipeline bloquea merge si falla suite critica.
- Artefactos de evidencia por corrida (reportes/logs/capturas).

### KAN-19 (owner: Abel, due: 2026-02-20)

Debe cubrir:

- Suite E2E ampliada con casos de excepcion:
  - `cancelada`, `no_show`, transicion invalida, rol no autorizado.
- Configuracion de gate fail-fast en CI.
- Checklist de DoD por historia y evidencia QA trazable.

---

## Criterio de cierre de fase

- [ ] Smoke E2E core estable.
- [ ] Gate de calidad activo en pipeline.
- [ ] Evidencias adjuntas por corrida critica.
- [ ] Sin fallas bloqueantes en contrato, estado o permisos.

---

## Criterio de cierre tecnico del epic KAN-4

No cerrar `KAN-4` hasta cumplir todo:

- [ ] `KAN-5`..`KAN-13` finalizados.
- [ ] `KAN-14`..`KAN-22` finalizados.
- [ ] `KAN-23`..`KAN-28` finalizados.
- [ ] Evidencia QA final consolidada (`KAN-19`).

---

## Checklist de release (copy/paste)

```text
Release checklist KAN-4:

1) Contracts API y errores alineados a KAN-8.
2) Maquina de estados valida en todos los caminos criticos.
3) SSE/fallback estable sin drift de estado.
4) Smoke E2E y suite completa en verde.
5) Evidencia de QA adjunta por ticket.
6) Sin bloqueos abiertos en Jira para KAN-4.
```

---

## Politica de bloqueo

Bloquear merge/release si ocurre cualquiera:

- Falla de contract tests.
- Falla de pruebas UI criticas.
- Falla E2E core.
- Regresion de permisos/roles.
- Inconsistencia de estado entre backend y frontend.

---

## Referencias

- `docs/guides/kan4-fase-3-consulta-y-tiempo-real.md`
- `docs/guides/kan4-matriz-tickets-y-dependencias.md`
- Jira `KAN-27`, Jira `KAN-19`
