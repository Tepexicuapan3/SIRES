# auth-access - DB Domain Execution Plan S1..S6 (KAN-103 Batch 2)

> TL;DR: plan ejecutable por fases `expand -> migrate -> contract` para completar KAN-103 desde S3 hasta S6 (KAN-109/KAN-105/KAN-108/KAN-104), con AC verificables, DoD, TDD-first, checkpoints, rollback por fase y checklist Go/No-Go de cierre.

## Contexto y alcance

- Ticket paraguas: **KAN-103**.
- Batch 1 ya completado: **S1/S2** en [`db-domain-to-be-map.md`](./db-domain-to-be-map.md) (KAN-107/KAN-106).
- Batch 2 (este documento): plan ejecutable para **S3/S4** y trazabilidad consolidada de **S1..S6**.
- Este artefacto **no redefine** el mapa TO-BE: lo referencia y lo operacionaliza.

## Matriz de subtareas S1..S6 (objetivo, entregables, AC y evidencia)

| Subtarea | Ticket | Objetivo | Entregables mínimos | AC verificables | Evidencia esperada |
|---|---|---|---|---|---|
| S1 | KAN-107 | Definir mapa TO-BE de ownership DB auth-access | `db-domain-to-be-map.md` con AS-IS/TO-BE + clasificación keep/move/consume-by-contract/split | Existe matriz AS-IS/TO-BE y decisión de frontera por grupo | PR docs + update en `decision-log.md` + `changelog.md` |
| S2 | KAN-106 | Alinear estado y trackers canónicos | Estado consistente en `domain-map` + `incremental-domain-migration` + hub dominio | No hay contradicción de estado del dominio en docs canónicos | Diff documental + referencia cruzada desde README |
| S3 | KAN-109 | Definir contratos cross-domain para datos no owner de auth-access | `db-cross-domain-contracts.md` (contratos permitidos + anti-patrones + transición FK->contract reference) | Se documentan mecanismos permitidos (contract/orchestrator/events) y prohibición explícita de SQL cross-domain | Tabla de contratos + checklist anti-patrones + guía de migración |
| S4 | KAN-105 | Definir plan de ejecución por fases con checkpoints y rollback | `db-domain-execution-plan-s1-s6.md` con fases, AC/DoD/TDD-first, rollback y validación | Cada fase contiene checkpoints verificables y plan de rollback explícito | Matriz de fases + checklist de gate por fase |
| S5 | KAN-108 | Ejecutar migraciones incrementales de ownership DB por slices críticos | Migraciones/ajustes en código + evidencia de paridad funcional y de datos | Drift=0 en reconciliación acordada, contrato API estable, auditoría intacta | Evidencia Red->Green->Refactor + reportes de reconciliación |
| S6 | KAN-104 | Contracción y retiro controlado de acoplamientos legacy | Eliminación de dependencia legacy + fallback acotado o retiro definitivo | Sin consultas SQL cross-domain en paths target, rollback rehearseado, monitoreo estable | Checklist de corte + smoke/regresión + acta go/no-go |

## Plan por fases (expand -> migrate -> contract)

### Fase 1 - Expand

**Objetivo:** preparar el sistema para desacoplar ownership sin cortar runtime.

**Subtareas foco:** S3/S4 (KAN-109/KAN-105) y precondiciones de S5.

**Actividades clave:**
- Definir contratos cross-domain para datos externos a auth-access (ej. centros de atención).
- Introducir referencias por contrato (contract reference) en paralelo a FKs legacy donde aplique.
- Establecer tasking TDD-first por slice antes de tocar código de negocio.

**Checkpoints de salida (gate):**
- [ ] Contratos permitidos y anti-patrones prohibidos documentados y versionados.
- [ ] Plan S1..S6 con AC verificables y evidencia esperada está publicado.
- [ ] Cada slice tiene plan Red->Green->Refactor y estrategia de rollback definida.

**Rollback fase Expand:**
- Revertir nuevas referencias no consumidas por runtime.
- Mantener rutas legacy como source of truth temporal.
- Invalidar únicamente artefactos de planificación de la fase sin afectar operación.

### Fase 2 - Migrate

**Objetivo:** mover lectura/escritura de datos al ownership TO-BE por lotes controlados.

**Subtareas foco:** S5 (KAN-108), ejecutando por incrementos pequeños.

**Actividades clave:**
- Backfill y reconciliación por entidad/grupo.
- Doble lectura/escritura temporal solo cuando sea imprescindible y con ventana acotada.
- Verificación de contrato externo en lugar de join/FK cross-domain.

**Checkpoints de salida (gate):**
- [ ] Paridad funcional en endpoints afectados sin romper contrato HTTP/API.
- [ ] Reconciliación de datos sin drift en dominios críticos (criterio acordado por slice).
- [ ] Auditoría y trazabilidad (`request_id`, actor, before/after) preservadas.

**Rollback fase Migrate:**
- Conmutar a source legacy por feature flag/switch documentado.
- Revertir lote de migración afectado (no rollback global) y repetir reconciliación.
- Mantener evidencia del incidente + causa raíz para siguiente intento.

### Fase 3 - Contract

**Objetivo:** retirar acoplamiento legacy luego de validar estabilidad.

**Subtareas foco:** S6 (KAN-109).

**Actividades clave:**
- Remover accesos SQL/FK cross-domain prohibidos.
- Consolidar consumo por contrato/orquestación/evento según caso.
- Cerrar toggles transitorios que ya no aportan seguridad operativa.

**Checkpoints de salida (gate):**
- [ ] No quedan accesos SQL cross-domain en paths del alcance.
- [ ] Monitoreo y alertas mínimas en verde durante ventana acordada.
- [ ] DoD del slice marcado con evidencia TDD-first y rollback rehearsal.

**Rollback fase Contract:**
- Restaurar temporalmente el camino previo (si existe toggle de seguridad).
- Rehidratar artefactos/objetos retirados desde backup/migración inversa documentada.
- Reabrir slice en estado `migrate` hasta cerrar causa raíz.

## AC/DoD/TDD-first (reglas transversales)

## Gap analysis obligatorio (KAN-103 AC)

La priorización explícita de faltantes de dominio se mantiene en [`db-gap-analysis-prioritization.md`](./db-gap-analysis-prioritization.md) con clasificación `must/should/could`.

- Los ítems `MUST` son precondición de salida para S5/S6.
- Los ítems `SHOULD/COULD` no pueden bloquear `MUST`, pero deben quedar trazados.

## AC mínimos transversales

1. No hay SQL cross-domain en código de aplicación para datos no owner.
2. Todo consumo de datos externos a auth-access usa contrato formal (API, orchestrator use case o domain event).
3. Trazabilidad Jira ↔ docs ↔ evidencia técnica queda explícita por subtarea.

## DoD mínimo por subtarea

- AC en estado verificable (`pass/parcial/bloqueado`) con evidencia concreta.
- Documentación canónica actualizada en el mismo cambio (README + decision-log + changelog + backlog mapping).
- Rollback probado (o simulación documentada) para la fase correspondiente.

## Regla TDD-first obligatoria

- Planificación: cada slice inicia con tareas de test antes de implementación.
- Ejecución: ciclo **Red -> Green -> Refactor** sin saltar RED.
- Evidencia: comandos/resultados y vínculo a tests por slice en Jira/PR.
- Excepción: solo con racional explícito + controles compensatorios + aprobación registrada.

## Reglas de validación operativa

- **Docker-first cuando aplique**: validaciones técnicas se ejecutan en entorno containerizado (`docker compose`), sin levantar servicios en host.
- Validar por lote/slice (no big-bang): smoke + contract checks + reconciliación.
- Verificar preservación de auditoría para operaciones sensibles de auth/access.
- Confirmar enlaces cruzados desde el hub del dominio (`README.md`) a este plan y a contratos cross-domain.

## Trazabilidad consolidada Jira ↔ Docs (KAN-103)

| Ticket | Subtarea | Artefacto principal | Estado de trazabilidad esperado |
|---|---|---|---|
| KAN-107 | S1 | `db-domain-to-be-map.md` | Referenciado desde README/decision-log/changelog/backlog mapping |
| KAN-106 | S2 | `db-domain-to-be-map.md` + trackers canónicos | Estado documental consistente en índices y trackers |
| KAN-109 | S3 | `db-cross-domain-contracts.md` | Contratos y anti-patrones publicados + links cruzados |
| KAN-105 | S4 | `db-domain-execution-plan-s1-s6.md` | Plan por fases con AC/DoD/TDD-first/rollback |
| KAN-108 | S5 | (evidencia de ejecución batch futuro) | Registro de reconciliación + evidencia TDD por slice |
| KAN-104 | S6 | (evidencia de contracción batch futuro) | Acta de corte + validación de retiro de acoplamiento |

## Cierre Batch 3 (S5+S6, KAN-108/KAN-104)

En Batch 3 se consolida la capa operativa/documental para cierre de S5/S6 sin abrir alcance funcional de endpoints:

- **Bootstrap/seeds alineados al TO-BE**: se valida que el flujo de seed auth-access mantiene foco en entidades del dominio y no introduce mutaciones sobre catálogos externos fuera de contrato.
- **Reproducibilidad Docker-first**: se estandariza validación automatizada con targets `make test-seed-auth-command` y `make validate-auth-access-bootstrap`.
- **Gate de salida KAN-103**: se incorpora checklist canónica [`kan-103-go-no-go-checklist.md`](./kan-103-go-no-go-checklist.md) con criterios S1..S6, evidencia requerida y clasificación bloqueante/no-bloqueante.

Estado de trazabilidad para esta fase de cierre:

- S5 (KAN-108): **operativizado para ejecución reproducible**.
- S6 (KAN-109): **gate de corte/go-no-go formalizado**.

## Referencias

- [`db-domain-to-be-map.md`](./db-domain-to-be-map.md)
- [`db-cross-domain-contracts.md`](./db-cross-domain-contracts.md)
- [`db-gap-analysis-prioritization.md`](./db-gap-analysis-prioritization.md)
- [`kan-103-go-no-go-checklist.md`](./kan-103-go-no-go-checklist.md)
- [`rbac-db-ownership-migration-strategy.md`](./rbac-db-ownership-migration-strategy.md)
- [`backlog-mapping.md`](./backlog-mapping.md)
- `docs/architecture/dependency-rules.md`
- `docs/architecture/db-ownership-migration-policy.md`
