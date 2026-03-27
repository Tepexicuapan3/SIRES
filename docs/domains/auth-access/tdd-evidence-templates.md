# auth-access - Plantillas de evidencia TDD-first (KAN-55)

> TL;DR: si no está esta evidencia en Jira/PR, el cambio no pasa gate. No alcanza con “los tests pasan”.

## 1) Uso obligatorio

Aplicar en NEW feature / NEW functionality / LARGE refactor de `auth-access`.

Campos mínimos por slice:
- `slice`
- `risk_level`
- `ticket_ref`
- `sdd_change_ref`

## 2) Plantilla Jira (Red -> Green -> Refactor)

```md
### TDD Evidence - {slice} ({risk_level})

#### RED
- Test(s) creado(s) antes de código productivo:
  - {test_name_1}
  - {test_name_2}
- Comando ejecutado:
  - `{test_command}`
- Evidencia de falla inicial:
  - {failing_assertion_or_error}
  - Run ref: {ci_or_local_run_link}

#### GREEN
- Cambio mínimo aplicado:
  - {files_or_module_changed}
- Comando ejecutado:
  - `{test_command}`
- Evidencia en verde:
  - {passing_summary}
  - Run ref: {ci_or_local_run_link}

#### REFACTOR
- Limpieza aplicada sin cambiar comportamiento:
  - {refactor_notes}
- Verificación de no regresión:
  - `{test_command}`
  - Run ref: {ci_or_local_run_link}

#### Coverage vs Risk Gate
- Risk level: {P0|P1|P2}
- Unit/service: {ok|missing}
- Integration/API: {ok|missing|n/a}
- E2E critical: {ok|missing|n/a}
- Result: {GO|NO-GO}
```

## 3) Plantilla PR (resumen ejecutivo verificable)

```md
## TDD-first Evidence

- Slice: {slice}
- Risk: {P0|P1|P2}
- Jira: {KAN-xx}
- SDD: {sdd/change}

### RED
- Test first proof:
  - {test_name} -> failed with `{error_or_assert}`
  - Run: {link_or_output}

### GREEN
- Minimal implementation reference:
  - {file_ref}
- Passing run:
  - {link_or_output}

### REFACTOR
- Refactor scope (no behavior change):
  - {summary}
- Regression run:
  - {link_or_output}

### Risk Gate Check
- Required minimums for {risk_level}: {matrix_row}
- Evidence complete?: {yes|no}
- Exception requested?: {no|yes -> link to exception record}
```

## 4) Ejemplos rápidos por riesgo

### P2 (read-only)
- RED: falla de serialización/campos requeridos.
- GREEN: ajuste mínimo de mapper/serializer.
- REFACTOR: deduplicación de helper.

### P1 (mutación controlada)
- RED: falla de regla core + 1 integration/API.
- GREEN: implementación mínima del use case/policy.
- REFACTOR: limpieza de capa de aplicación.

### P0 (autorización crítica)
- RED: fallan reglas críticas + deny cases.
- GREEN: corrección mínima en policy/use case + contratos.
- REFACTOR: simplificación interna con suite completa verde.

## 5) Criterio de rechazo inmediato

Se rechaza PR si:
- falta evidencia RED inicial,
- el riesgo declarado no coincide con matriz KAN-55,
- falta mínimo de cobertura por riesgo,
- hay excepción sin aprobación/trazabilidad.

## 6) Referencias

- `docs/domains/auth-access/tdd-risk-strategy-kan-55.md`
- `docs/domains/auth-access/tdd-exception-policy.md`
- `.github/pull_request_template.md`
