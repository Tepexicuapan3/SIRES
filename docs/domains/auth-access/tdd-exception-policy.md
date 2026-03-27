# auth-access - Política de excepción TDD-first (KAN-55)

> TL;DR: excepción TDD no es atajo. Es un mecanismo de riesgo controlado, con aprobación formal, vencimiento y deuda visible.

## 1) Cuándo se permite pedir excepción

Solo en casos extraordinarios:
- incidente crítico en producción con ventana operacional acotada,
- bloqueo externo no controlable (infra/dependencia) que impide ciclo completo temporalmente,
- requisito regulatorio urgente con deadline inminente y controles compensatorios definidos.

“No llegamos con tiempos” NO es motivo válido.

## 2) Registro obligatorio (`TddExceptionRecord`)

Todo pedido debe incluir:

| Campo | Obligatorio | Regla |
|---|---|---|
| `reason` | Sí | Técnica, concreta, verificable |
| `blast_radius` | Sí | `low` / `medium` / `high` |
| `compensating_controls` | Sí | tests/monitoring/review explícitos |
| `approver_role` | Sí | ver sección 3 |
| `approval_ref` | Sí | link a Jira comment o PR review |
| `expiry` | Sí | fecha/hora ISO-8601 |
| `owner` | Sí | responsable de cierre de deuda |

Solicitud incompleta => **rechazo automático**.

## 3) Modelo de aprobación

- `blast_radius=low|medium` -> aprueba `domain_owner`.
- `blast_radius=high` -> aprobación dual: `domain_owner + security_owner`.

Sin aprobación requerida, no hay excepción válida.

## 4) Controles compensatorios mínimos

Al menos 2, y siempre uno debe ser de testing:
- test de contrato API adicional,
- test de auditoría/requestId,
- monitoreo runtime temporal con alertas,
- revisión de seguridad dedicada,
- plan de rollback explícito y probado.

## 5) Seguimiento y vencimiento (enforcement)

Checklist obligatorio posterior a aprobación:

- [ ] Due date cargada en Jira.
- [ ] Compensating tests implementados y passing antes de `expiry`.
- [ ] Evidencia anexada en PR/Jira.
- [ ] Estado de excepción actualizado (`open` -> `closed`).

Regla de bloqueo:
- Excepción vencida sin cierre -> **delivery block** hasta remediación.

## 6) Integración con Go/No-Go

Una excepción aprobada:
- no elimina guardrails no negociables,
- no habilita breaking API no versionado,
- no habilita cross-domain direct access,
- no reemplaza evidencia mínima cuando el plazo de excepción vence.

## 7) Plantilla rápida de excepción (copy/paste)

```yaml
TddExceptionRecord:
  reason: "..."
  blast_radius: "low|medium|high"
  compensating_controls:
    - "contract_test:{name}"
    - "audit_review:{scope}"
  approver_role: "domain_owner|domain_owner+security_owner"
  approval_ref: "https://..."
  expiry: "2026-04-15T23:59:00Z"
  owner: "@responsable"
```

## 8) Referencias

- `docs/domains/auth-access/tdd-risk-strategy-kan-55.md`
- `docs/domains/auth-access/tdd-evidence-templates.md`
- `docs/guides/pr-merge-governance.md`
- `docs/guides/domain-dor-dod.md`
