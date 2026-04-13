# auth-access - DB Gap Analysis Prioritization (KAN-103)

> TL;DR: priorización explícita de gaps de datos para Auth-Access en formato `must / should / could`, usada como criterio de cierre de KAN-103 y entrada de planificación para implementación posterior.

## Contexto

KAN-103 exige documentar faltantes de dominio con prioridad explícita antes de ejecutar separación física por dominio. Esta matriz evita mezclar deuda estructural con mejoras opcionales y permite secuenciar S5/S6 con foco en riesgo.

## Matriz de priorización (must / should / could)

| Prioridad | Gap | Riesgo si no se atiende | Alcance sugerido |
|---|---|---|---|
| **MUST** | Ownership unificado de RBAC (`roles`, `permissions`, `user-role`, `role-permission`, `overrides`) | Persistencia de doble ownership + drift contractual/migratorio | S5/S6 (KAN-108/KAN-104) |
| **MUST** | Contratos cross-domain obligatorios para datos no owner (ej. centros de atención) | Acoplamiento SQL/FK indebido y violación de `dependency-rules` | S3/S4 (KAN-109/KAN-105) |
| **MUST** | Reconciliación de datos por fase (`expand -> migrate -> contract`) con evidencia de drift | Riesgo de inconsistencias silenciosas en cutover | S5 (KAN-108) |
| **MUST** | Preservación de auditoría auth/rbac en transiciones de ownership | Pérdida de trazabilidad y fallas de compliance | S5/S6 |
| **SHOULD** | Modelo explícito de revocación/sesión persistente para invalidación granular | Menor control operativo en incidentes de credenciales | Post KAN-103 (KAN-101/KAN-100 relacionados) |
| **SHOULD** | Historial de credenciales (no reutilización, expiración avanzada) | Menor madurez de policy para hardening | Post KAN-103 |
| **SHOULD** | Catálogo de eventos forenses de seguridad persistentes (OTP/rate-limit/lock) | Menor capacidad forense y RCA | Post KAN-103 (KAN-100) |
| **COULD** | Automatización de reportes comparativos de paridad de datos por batch | Más esfuerzo manual en validación de migración | Iteración posterior |
| **COULD** | Dashboard de estado de contratos cross-domain por dominio | Baja visibilidad transversal, sin bloquear ejecución técnica | Iteración posterior |

## Reglas operativas de uso

1. Ningún ítem `SHOULD/COULD` desplaza un `MUST` en S5/S6.
2. Todo `MUST` requiere evidencia verificable (tests/comandos/documento) antes de marcar GO.
3. Si aparece nuevo gap crítico durante ejecución, se clasifica inmediatamente en esta matriz y se sincroniza con Jira.

## Trazabilidad Jira

- Ticket paraguas: **KAN-103**
- S1/S2: KAN-107/KAN-106
- S3/S4: KAN-109/KAN-105
- S5/S6: KAN-108/KAN-104

## Referencias

- [`db-domain-to-be-map.md`](./db-domain-to-be-map.md)
- [`db-domain-execution-plan-s1-s6.md`](./db-domain-execution-plan-s1-s6.md)
- [`db-cross-domain-contracts.md`](./db-cross-domain-contracts.md)
- [`kan-103-go-no-go-checklist.md`](./kan-103-go-no-go-checklist.md)
