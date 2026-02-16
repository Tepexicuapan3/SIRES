# KAN-4 - Playbook de Implementacion Controlada

> **TL;DR:** Esta documentacion define reglas, fases, gates y evidencias para ejecutar la feature `KAN-4` (Flujo Consulta Medica v1) sin supuestos. Si algo no esta definido aqui o en Jira, se marca bloqueo y no se inventa.

**Fecha creacion:** 2026-02-16  
**Ultima actualizacion:** 2026-02-16  
**Autor:** OpenCode

---

## Contexto y Problema

El epic `KAN-4` se construye con deadline de entrega el **2026-02-20** y con estrategia **TDD-first**. El riesgo principal no es solo tecnico: es la ambiguedad en ejecucion (agentes que asumen cosas no definidas, saltan gates o cambian contrato).

Este playbook estandariza la ejecucion para que cada ticket tenga:

- entradas explicitas,
- salidas verificables,
- dependencias claras,
- criterio de cierre objetivo.

---

## Fuente de Verdad (orden de prioridad)

1. Jira `KAN-4` y subtareas `KAN-5` a `KAN-28`.
2. Contratos cerrados en `KAN-8`.
3. Reglas de calidad en `KAN-10`.
4. Este paquete de documentos en `docs/guides/kan4-*.md`.

Si hay conflicto, **gana Jira**. Si Jira esta ambiguo, se detiene la ejecucion y se registra bloqueo.

---

## Reglas Anti-Alucinacion (mandatorias)

1. No inventar endpoints fuera de `KAN-8`.
2. No inventar campos de payload ni codigos de error.
3. No cambiar la maquina de estados v1:
   - `en_espera -> en_somatometria -> lista_para_doctor -> en_consulta -> cerrada`
   - alternos: `cancelada`, `no_show`
4. No saltar TDD: primero pruebas en rojo, luego implementacion, luego refactor.
5. No marcar ticket en Done sin evidencia ejecutable (tests, logs, reportes).
6. Si falta una definicion funcional/tecnica, registrar bloqueo y pedir definicion puntual.

---

## Fases de Implementacion

1. **Fase 0 - Baseline de planeacion:** `docs/guides/kan4-fase-0-baseline-planeacion.md`
2. **Fase 1 - TDD y fundaciones BE:** `docs/guides/kan4-fase-1-tdd-fundaciones.md`
3. **Fase 2 - Recepcion y Somatometria (BE/FE):** `docs/guides/kan4-fase-2-implementacion-recepcion-somatometria.md`
4. **Fase 3 - Consulta y tiempo real (SSE):** `docs/guides/kan4-fase-3-consulta-y-tiempo-real.md`
5. **Fase 4 - QA final y release gate:** `docs/guides/kan4-fase-4-qa-y-release.md`

Matriz consolidada de tickets: `docs/guides/kan4-matriz-tickets-y-dependencias.md`

---

## Calendario Operativo Validado

- **Vie 13-feb:** cierre de planeacion (completado).
- **Lun 16-feb:** `KAN-23`, `KAN-24`, `KAN-25` (TDD backend).
- **Mar 17-feb:** `KAN-16`, `KAN-14`, `KAN-18`, `KAN-26`, `KAN-28`.
- **Mie 18-feb:** `KAN-22`, `KAN-17`, `KAN-20`, `KAN-27`.
- **Jue 19-feb:** `KAN-21` + estabilizacion.
- **Vie 20-feb:** `KAN-19` + cierre tecnico epic.

Notas:

- 14/15-feb se tratan como no laborables.
- Si `KAN-22` se atrasa, impacta directo `KAN-17`, `KAN-20`, `KAN-19`.

---

## Criterio Global de Cierre

Para cerrar implementacion sin deuda critica:

- Contratos API y errores alineados a `KAN-8`.
- Reglas de estado y permisos validadas por pruebas.
- UI sin llamadas HTTP directas desde componentes.
- SSE/fallback estable con evidencia.
- Smoke E2E y quality gate en verde.
- Evidencia por ticket (logs, reporte, capturas cuando aplique).

---

## Plantilla Copy/Paste para iniciar cualquier ticket

```text
Contexto: Voy a ejecutar [TICKET_KEY] del epic KAN-4.

Reglas:
1) No inventar contrato ni estados fuera de KAN-8.
2) Ejecutar TDD-first (rojo -> verde -> refactor).
3) Respetar gates del ticket (blocked by / desbloquea).

Salida obligatoria:
- Cambios realizados
- Pruebas ejecutadas y resultado
- Evidencia adjunta
- Riesgos o bloqueos encontrados
```

---

## Referencias

- Jira epic: `KAN-4`
- Baseline funcional/tecnico: `KAN-5`..`KAN-13`
- Implementacion: `KAN-14`..`KAN-22`
- TDD y gates: `KAN-23`..`KAN-28`
