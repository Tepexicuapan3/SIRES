# auth-access - DB Cross-Domain Contracts

> TL;DR: auth-access no consume SQL directo sobre datos de otros dominios. Para datos externos (ej. centros de atención) se usan contratos formales (API/orquestador/eventos), con transición explícita de FK legacy a contract reference.

## Contexto

Este documento operacionaliza la regla de `dependency-rules`: **sin acceso DB cross-domain desde código de aplicación**. Se alinea con el TO-BE de KAN-103 y evita acoplamiento oculto por FKs o joins a tablas no owner.

## Contratos permitidos para datos fuera de auth-access

| Dato externo requerido por auth-access | Dominio owner | Mecanismo permitido | Contrato mínimo | Notas |
|---|---|---|---|---|
| Centro de atención (`cat_centros_atencion`) | `catalogos` | Query/Service contract (API/read model) | `center_id`, `center_code`, `center_status`, `updated_at` | Referencia canónica de ejemplo `consume-by-contract` en KAN-103 |
| Datos cross-domain para flujos multi-paso | Dominio owner correspondiente | Orchestrator use case | Input/Output tipado + policy + auditoría | Cuando se requiere orden transaccional entre dominios |
| Propagación de cambios no síncronos | Dominio owner correspondiente | Domain events (internal-first) | Event name versionado + payload mínimo + idempotency key | Para side-effects y consistencia eventual |

## Anti-patrones prohibidos

1. Joins SQL directos de auth-access hacia tablas de `catalogos`/`administracion`/otros dominios.
2. FKs nuevas apuntando a tablas no owner de auth-access como mecanismo principal de integración.
3. Lectura/escritura por repositorios internos de otro dominio.
4. Lógica de autorización basada en datos cross-domain sin pasar por contrato versionado.
5. “Atajos” de reporting en rutas transaccionales que rompen ownership.

## Guía de transición: FK legacy -> contract reference

## Objetivo de transición

Reemplazar dependencia fuerte a esquema externo por una referencia estable de contrato, manteniendo integridad funcional y trazabilidad.

## Paso 1 - Inventariar dependencia legacy

- Identificar columnas FK o joins cross-domain activos.
- Clasificar por riesgo (lectura, escritura, seguridad, auditoría).
- Declarar owner y contrato destino.

**Salida mínima:** inventario versionado por slice.

## Paso 2 - Expand (introducir contract reference)

- Agregar campos de referencia por contrato (ej. `center_ref_id`, `center_ref_code`) en entidades auth-access.
- Implementar adaptador de consulta por contrato (API/orquestador/read-model), sin retirar aún el camino legacy.
- Definir fallback operativo explícito.

**AC de transición:** contract reference coexistiendo con legado sin romper API pública.

## Paso 3 - Migrate (dual-read/validación)

- Activar lectura por contrato y comparar paridad contra fuente legacy por ventana definida.
- Corregir drift y consolidar reconciliación.
- Mantener auditoría de source utilizado.

**AC de transición:** paridad funcional + drift dentro del umbral acordado (ideal: 0 en datos críticos).

## Paso 4 - Contract (retiro de acoplamiento)

- Remover FK/join cross-domain en paths target.
- Dejar solo contract reference + validaciones de integridad local.
- Eliminar código de fallback cuando exista evidencia de estabilidad.

**AC de transición:** cero SQL cross-domain en el alcance + rollback rehearseado/documentado.

## Checklist de validación por transición

- [ ] Mecanismo usado está en la lista permitida (contract/orchestrator/event).
- [ ] No se agregaron joins SQL cross-domain en código de aplicación.
- [ ] Hay evidencia TDD-first (Red->Green->Refactor) para el slice.
- [ ] Se preserva auditoría mínima (`actor`, `timestamp`, `action`, `result`, `contextId/requestId`).
- [ ] Rollback por fase está documentado y probado/simulado.

## Referencias

- [`db-domain-to-be-map.md`](./db-domain-to-be-map.md)
- [`db-domain-execution-plan-s1-s6.md`](./db-domain-execution-plan-s1-s6.md)
- `docs/architecture/dependency-rules.md`
- `docs/architecture/db-ownership-migration-policy.md`
