# KAN-74 — Legacy Naming Exceptions / Allowlist (SIRES -> SISEM)

## Context

KAN-74 renombra superficies visibles y de configuracion de **SIRES** a **SISEM**.
Este registro documenta ocurrencias legacy de `SIRES` que se mantienen **intencionalmente** por compatibilidad tecnica o trazabilidad historica.

Este archivo se usa como allowlist para el scan final de Fase 4 (task 4.1).

## Approved temporary exceptions

| Surface | Legacy reference kept | Why it remains | Removal trigger |
| --- | --- | --- | --- |
| `README.md` | `frontend/public/SIRES.webp` | Nombre fisico actual del asset en el repositorio. | Renombre de asset en ola posterior con ajuste de referencias. |
| `README.md` | `https://github.com/Luis-Ant/SISEM.git` | URL oficial vigente del repositorio. | Si cambia nuevamente el nombre oficial del repositorio. |
| `README.md` | `SIRES_LOGIN_URL`, `SIRES_SUPPORT_EMAIL` | Variables de entorno legacy activas en transicion; son contrato tecnico. | Cierre de deprecacion de variables `SIRES_*` (hard-cut aprobado). |
| `docs/getting-started/setup.md` | mencion de `SIRES_*` | Refleja aliases temporales de variables para transicion segura. | Cierre de deprecacion de aliases `SIRES_*`. |
| `docs/guides/kan-74-phase4-closure-evidence.md` | menciones `SIRES` en evidencia y comandos | Documento de auditoria/cierre necesita trazar explícitamente el legado evaluado. | Cierre definitivo de KAN-74 y archivado de evidencia historica. |
| `.github/workflows/ci.yml` | Texto de compatibilidad legacy en nombre de step | Evidencia explicita del periodo transicional de compatibilidad en CI. | Cierre de compatibilidad legacy y hard-cut aprobado. |
| `docker-compose.yml`, `.env.example`, `backend/.env.example`, `frontend/.env.example`, `backend/config/settings.py`, `backend/apps/authentication/services/email_service.py`, `.github/workflows/check-tooling-naming.sh` | aliases `SIRES_*` | Política compatibility-first: `SISEM_*` preferido con fallback temporal `SIRES_*`. | Hard-cut de variables legacy aprobado y ejecutado. |

## Scope note

Este registro cubre excepciones de KAN-74 en Docs/Public + Backend + Tooling.
No autoriza introducir nuevas referencias `SIRES` fuera de los casos listados arriba.
