# KAN-4 - Fase 1 TDD y Fundaciones Backend

> **TL;DR:** Esta fase define la base de calidad y dominio. Si no termina en verde, no se habilita implementacion de recepcion, somatometria ni consulta.

**Tickets de fase:** `KAN-23`, `KAN-24`, `KAN-25`, `KAN-16`

---

## Objetivo de la fase

Construir primero pruebas y reglas de dominio para reducir retrabajo en las APIs y evitar logica dispersa.

---

## Orden obligatorio de ejecucion

1. `KAN-23` - Matriz de pruebas de dominio y estados.
2. `KAN-24` - Contract tests recepcion/cola.
3. `KAN-25` - Contract tests somatometria/vitales.
4. `KAN-16` - Modulo clinico base y maquina de estados.

Regla:

- `KAN-16` no se cierra hasta que `KAN-23` este verde.
- `KAN-14`, `KAN-17`, `KAN-18` no arrancan sin salida de `KAN-16`.

---

## Especificacion por ticket

### KAN-23 (owner: Luis, due: 2026-02-16, estado actual: Finalizado)

Salida obligatoria:

- Matriz completa de transiciones validas/invalidas.
- Cobertura de `cancelada` y `no_show`.
- Guard clauses: sin vitales no pasa a doctor; sin diagnostico+nota no cierra.

### KAN-24 (owner: Luis, due: 2026-02-16, estado actual: Finalizado)

Salida obligatoria:

- Contratos para crear visita, listar cola, cambiar estado.
- Pruebas de permisos por rol recepcion.
- Errores normalizados (`code`, `message`, `status`, `requestId`).

### KAN-25 (owner: Luis, due: 2026-02-16, estado actual: Finalizado)

Salida obligatoria:

- Contratos de vitales con campos requeridos y validaciones de rango.
- Bloqueo de cambio a `lista_para_doctor` con datos incompletos.
- Reporte de casos limite en CI.

### KAN-16 (owner: Victor, due: 2026-02-19, estado actual: En curso)

Salida obligatoria:

- Estructura Django por dominio (`recepcion`, `somatometria`, `consultas`).
- Use case central de estado.
- Regla de capas respetada (`view -> serializer -> use_case -> repository`).
- Errores de dominio reutilizables.

---

## Gate de salida de fase

La fase termina solo si:

- [x] `KAN-23`, `KAN-24`, `KAN-25` estan en verde con evidencia.
- [ ] `KAN-16` esta implementado y validado con pruebas de dominio.
- [ ] Existe trazabilidad de errores/estados alineada a `KAN-8`.

---

## Evidencia minima requerida

- Resultado de pruebas unitarias y de contrato.
- Lista de transiciones cubiertas.
- Lista de errores de dominio probados.
- Referencia de commit/PR o artefacto CI.

---

## Riesgos comunes y mitigacion

1. **Riesgo:** mezclar logica de negocio en serializers.
   - **Mitigacion:** revisar use_case central antes de merge.
2. **Riesgo:** pruebas verdes parciales (sin casos borde).
   - **Mitigacion:** checklist de transiciones invalidas obligatorio.
3. **Riesgo:** contratos distintos a `KAN-8`.
   - **Mitigacion:** comparar payloads exactos antes de cerrar ticket.

---

## Prompt de ejecucion de fase (copy/paste)

```text
Ejecuta Fase 1 KAN-4 con enfoque TDD-first:

Orden: KAN-23 -> KAN-24 -> KAN-25 -> KAN-16.
No implementes endpoints finales fuera de contratos definidos.

Entrega final:
1) Matriz de estados y cobertura de casos limite.
2) Resultado de pruebas (rojo->verde).
3) Lista de errores de dominio validados.
4) Confirmacion de gate de salida de fase.
```

---

## Referencias

- `docs/guides/kan4-fase-0-baseline-planeacion.md`
- `docs/guides/kan4-fase-2-implementacion-recepcion-somatometria.md`
- `docs/guides/kan4-matriz-tickets-y-dependencias.md`
