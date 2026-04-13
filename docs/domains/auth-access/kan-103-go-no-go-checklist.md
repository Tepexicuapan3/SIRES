# KAN-103 - Go/No-Go Checklist (S1..S6)

> TL;DR: checklist final de salida para KAN-103. Define criterios por subtarea S1..S6, evidencia mínima exigida y clasificación de bloqueantes/no-bloqueantes.

## Criterios de salida por subtarea

| Subtarea | Ticket | Criterio de salida | Estado esperado |
|---|---|---|---|
| S1 | KAN-107 | Mapa TO-BE DB-domain publicado con clasificación keep/move/consume-by-contract/split | PASS |
| S2 | KAN-106 | Estado del dominio consistente en trackers canónicos (`domain-map`, `incremental-domain-migration`, hub dominio) | PASS |
| S3 | KAN-109 | Contratos cross-domain y anti-patrones SQL explícitos para datos no owner | PASS |
| S4 | KAN-105 | Plan S1..S6 con fases `expand -> migrate -> contract`, AC/DoD/TDD-first y rollback | PASS |
| S5 | KAN-108 | Bootstrap/seeding reproducible y alineado al TO-BE sin mutaciones cross-domain indebidas | PASS |
| S6 | KAN-104 | Checklist de corte y dictamen Go/No-Go con evidencia Docker-first | PASS |

## Evidencias requeridas

## Evidencia documental

- `db-domain-to-be-map.md` (S1)
- `db-cross-domain-contracts.md` (S3)
- `db-domain-execution-plan-s1-s6.md` (S4)
- `db-gap-analysis-prioritization.md` (priorización must/should/could requerida por AC KAN-103)
- `local-db-bootstrap-strategy.md` actualizado con validación Docker-first (S5)
- `decision-log.md` y `changelog.md` actualizados con cierre Batch 3 (S5/S6)

## Evidencia técnica mínima (Docker-first)

1. Setup base+demo+edge+factory en contenedor backend.
2. Suite de tests de seed command (`apps.authentication.tests.test_seed_auth_access_command`) en Docker.
3. Verificación explícita de no-mutación de `cat_centros_atencion` durante seeds auth-access.

## Comandos de referencia

```bash
make setup-auth-full AUTH_FACTORY_USERS=25
make test-seed-auth-command
```

Opcional (atajo unificado):

```bash
make validate-auth-access-bootstrap AUTH_FACTORY_USERS=25
```

## Bloqueantes

- Falta de evidencia Docker-first para setup + tests de seeds.
- Detección de mutación sobre datos no owner (ej. `cat_centros_atencion`) en flujo de seed auth-access.
- Contradicciones activas entre artefactos canónicos (`db-domain-to-be-map`, `db-cross-domain-contracts`, `db-domain-execution-plan-s1-s6`).
- Ausencia de rollback explícito por fase en documentación vigente.

## No-bloqueantes (con seguimiento)

- Mejoras de ergonomía de comandos (aliases adicionales) sin impacto en reproducibilidad.
- Ajustes editoriales menores de redacción sin impacto en contratos/criterios de salida.
- Evidencia complementaria no crítica (capturas extra, formato de reporte), siempre que exista evidencia mínima verificable.

## Dictamen

- **GO**: todos los criterios S1..S6 en PASS + evidencia mínima completa.
- **NO-GO**: al menos un bloqueante abierto.
