# KAN-89 — Auth QA E2E Reproducibility Baseline (Opción 2)

> TL;DR: baseline reproducible con cambios mínimos. Este documento fija una matriz canónica `TC -> scenario -> usuario/email esperado` y el protocolo Docker-first para validar `backend-real` y `hybrid` con dictamen GO/NO-GO.

## Scope Freeze

- En alcance: documentación canónica, dataset compartido de tests, seed E2E opt-in e idempotente, trazabilidad por modo.
- Fuera de alcance: refactor funcional amplio de auth, nuevos casos de producto y expansión de cobertura fuera de TC críticos.

## Dataset canónico (source of truth)

Versión: `kan-89-v1`  
Password base: `Sisem_123456`

| TC crítico | Scenario | backend-real (seed) | hybrid (harness/MSW) | Email referencia | Resultado esperado |
| --- | --- | --- | --- | --- | --- |
| TC001 | `admin_success` | `admin` | `admin` | `admin@sisem.local` | Login exitoso |
| TC003 | `invalid_password` | `admin` + password incorrecta | `admin` + password incorrecta | `admin@sisem.local` | Error `INVALID_CREDENTIALS` |
| TC004 | `inactive_user` | `usuario_inactivo_clinico` | `inactive` | `inactivo.clinico@sisem.local` | Error `USER_INACTIVE` |
| TC005 | `blocked_user` | `usuario_bloqueado_clinico` | `locked` | `bloqueado.clinico@sisem.local` | Error `ACCOUNT_LOCKED` |
| TC007 | `onboarding_user` | `usuario_onboarding_clinico` | `newuser` | `onboarding.clinico@sisem.local` | Flujo onboarding |
| TC010/012/013/014 | `password_reset_user` | `usuario_cambiar_clave_clinico` / emails canónicos | `clinico` / emails canónicos | `clinico@sisem.local` + matriz por browser | OTP/reset estable |

## Bootstrap Docker (opt-in)

- `RUN_SEED_ON_BOOT` mantiene comportamiento actual (seed base).
- `RUN_E2E_SEED_ON_BOOT=true` ejecuta `python seed_e2e.py` después de `migrate` + seed base.
- Default de `RUN_E2E_SEED_ON_BOOT`: `false`.

## Protocolo de validación (2 corridas + reproducibilidad)

1. Stack limpio.
2. Corrida A (`backend-real`).
3. Corrida B (`hybrid`).
4. Repetir A y B una segunda vez (misma config/dataset).

### Comandos base

```bash
docker compose up -d
docker compose exec frontend bun run test:e2e:auth:critical:real
docker compose exec frontend bun run test:e2e:auth:critical:hybrid
```

## Evidencia mínima obligatoria

- Comandos exactos ejecutados.
- `mode` activo del harness y `dataset.version` logueados.
- Referencia de dataset usado (`kan-89-v1`).
- Resultado por TC crítico.
- Dictamen final por modo: `GO` o `NO-GO`.
- Riesgos residuales.

## Plantilla de dictamen GO/NO-GO

| Modo | Pasada 1 | Pasada 2 | Paridad | Dictamen |
| --- | --- | --- | --- | --- |
| `backend-real` | ☐ PASS / ☐ FAIL | ☐ PASS / ☐ FAIL | ☐ OK / ☐ DRIFT | ☐ GO / ☐ NO-GO |
| `hybrid` | ☐ PASS / ☐ FAIL | ☐ PASS / ☐ FAIL | ☐ OK / ☐ DRIFT | ☐ GO / ☐ NO-GO |
