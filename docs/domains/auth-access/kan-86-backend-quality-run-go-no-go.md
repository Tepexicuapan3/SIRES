# KAN-86 - Backend Quality Run (Docker-first) Go/No-Go

> TL;DR: Se ejecutó corrida de calidad backend para `login/onboarding/reset-password` en Docker. Flujos funcionales y contratos pasan en verde, pero el arranque limpio con `--build` falló por resolución DNS hacia PyPI durante build de backend. Dictamen: **NO-GO condicional**.

## 1) Scope ejecutado

- Ticket: `KAN-86`
- Dominio: `auth-access`
- Objetivo: validar calidad backend Docker-first + dictamen Go/No-Go Módulo 1.

Cobertura ejecutada:

- Arranque limpio simulado (`docker compose down` + `docker compose up --build -d`).
- Verificación operativa de `start-docker.sh` (espera DB + `manage.py migrate` + arranque ASGI).
- Validación funcional/contractual de flujos críticos `login`, `onboarding`, `reset-password`.
- Recolección de logs de startup de `auth-db` y `backend`.

## 2) Bitácora de comandos

```bash
docker compose down
docker compose up --build -d
docker compose ps
docker compose up -d
docker compose logs backend
docker compose exec backend python manage.py test apps.authentication.tests.test_auth_api apps.authentication.tests.test_auth_contract_edges apps.authentication.tests.test_auth_observability_api -v 2
docker compose logs --no-color --since 30m auth-db backend > kan-86-startup-quality-run.log
```

## 3) Evidencia de startup limpio

### 3.1 Resultado de `docker compose up --build -d`

- `frontend`: build completado.
- `backend`: build falló en `pip install -r requirements.txt` por errores de resolución DNS (`Temporary failure in name resolution`) hacia índice de paquetes.

Extracto:

```text
ERROR: Could not find a version that satisfies the requirement asgiref==3.11.0
ERROR: No matching distribution found for asgiref==3.11.0
```

### 3.2 Resultado de `docker compose up -d` (sin rebuild)

- Servicios levantados y saludables con imágenes locales cacheadas:
  - `auth-db`: healthy
  - `redis`: healthy
  - `backend`: healthy
  - `frontend`: running

### 3.3 Extracto de logs backend + DB

Archivo: `docs/domains/auth-access/evidence/kan-86-startup-quality-run.md`

```text
sires-backend  | Operations to perform:
sires-backend  |   Apply all migrations: ...
sires-backend  | Running migrations:
sires-backend  |   No migrations to apply.
sires-backend  | Starting server at tcp:port=5000:interface=0.0.0.0
sires-auth-db  | database system is ready to accept connections
```

## 4) Resultado de validación backend (login/onboarding/reset-password)

Suite ejecutada:

```bash
python manage.py test \
  apps.authentication.tests.test_auth_api \
  apps.authentication.tests.test_auth_contract_edges \
  apps.authentication.tests.test_auth_observability_api -v 2
```

Resultado:

- `Ran 64 tests in 124.010s`
- `OK`

Cobertura observada en alcance:

- Login: éxito, errores, bloqueo, throttling, request-id.
- Onboarding: éxito, validaciones, CSRF, contratos de error.
- Reset-password: request/verify/reset, contratos de error, CSRF y rate limits.

## 5) Matriz de hallazgos

| Hallazgo | Severidad | Impacto | Estado |
| --- | --- | --- | --- |
| Falla de resolución DNS durante build backend (`pip install`) en `up --build` | Alta (infra) | Impide bootstrap reproducible desde cero en este entorno | Abierto |
| Flujos críticos auth (`login/onboarding/reset-password`) en suite backend | Baja | Sin falla funcional detectada en runtime levantado con cache local | Cerrado |

## 6) Checklist Go/No-Go (Módulo 1)

- [x] Flujos login/onboarding/reset-password pasan validación funcional definida.
- [x] No se observaron defectos críticos/altos de funcionalidad auth en la corrida de pruebas.
- [x] Pruebas backend de alcance ejecutadas en Docker con resultados documentados.
- [x] Evidencia técnica consolidada (comandos, resultados y logs).
- [ ] Arranque limpio reproducible con `docker compose up --build -d` en el entorno auditado.

## 7) Dictamen final

**NO-GO condicional**

Justificación:

- La calidad funcional backend del alcance está en verde.
- Pero el criterio operativo de bootstrap limpio Docker-first no se cumple por fallo de infraestructura de red (DNS/resolución hacia repositorio de paquetes) durante build.

Condición para pasar a **GO**:

1. Restablecer conectividad DNS/salida a repositorios de paquetes en el entorno de build.
2. Repetir `docker compose down && docker compose up --build -d`.
3. Confirmar arranque saludable y re-ejecutar la suite de 64 tests en Docker.
