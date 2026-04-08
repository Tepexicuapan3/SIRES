# KAN-70 - Evidence Matrix Template (AC -> Evidencia)

Plantilla reusable para cierre evidence-first de KAN-70 (Sprint 1 Auth-Access).

## Contrato de fila (`ActaACRow`)

```yaml
ActaACRow:
  ac_id: string
  ticket_fuente: string[]
  jira_url: string
  pr_url: string[]
  test_evidence: string[]
  doc_ref: string[]
  tdd_phase:
    red: string
    green: string
    refactor: string
  resultado: validado | gap | invalidado
  severidad: baja | media | critica
  observaciones: string
```

## Matriz base (estado inicial RED documental)

> Regla de arranque: toda fila inicia con `resultado=gap` hasta validar evidencia mínima obligatoria.

| ac_id | ticket_fuente | jira_url | pr_url | test_evidence | doc_ref | tdd_phase(red/green/refactor) | resultado | severidad | observaciones |
|---|---|---|---|---|---|---|---|---|---|
| AC-1 | KAN-59, KAN-61, KAN-65, KAN-69 | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE | PENDIENTE | gap | media | Completar trazabilidad Jira↔PR↔tests↔docs por ticket fuente. |
| AC-2 | KAN-70 | PENDIENTE | N/A | PENDIENTE | PENDIENTE | PENDIENTE | gap | media | Falta validar reglas determinísticas de estado y consistencia Jira↔docs. |
| AC-3 | KAN-70, KAN-71 | PENDIENTE | N/A | PENDIENTE | PENDIENTE | PENDIENTE | gap | media | Falta registrar riesgos abiertos, owner, ETA y plan de continuidad. |

## Criterios mínimos de validación por fila

- `jira_url` accesible o gap formal con owner+ETA.
- `pr_url` trazable al ticket fuente (si aplica).
- `test_evidence` con comando/resultado o referencia verificable.
- `doc_ref` a evidencia canónica del dominio.
- `tdd_phase` con prueba de RED->GREEN->REFACTOR o excepción TDD aprobada.
- `resultado` obligatorio: `validado`, `gap` o `invalidado`.
