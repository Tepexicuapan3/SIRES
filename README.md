# SIRES

![SIRES](frontend/public/SIRES.webp)

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![Django](https://img.shields.io/badge/Django-5+-0C4B33?logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/DRF-API-red)
![Bun](https://img.shields.io/badge/Bun-runtime-black?logo=bun&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-runtime-4479A1?logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-cache-DC382D?logo=redis&logoColor=white)

Sistema de Informacion de Registros Electronicos de Salud para Metro CDMX. SIRES centraliza operacion clinica, seguridad y trazabilidad en una arquitectura moderna React + Django.

## Que es SIRES

SIRES es una plataforma web para gestion clinica y administrativa. Combina frontend React 19 con backend Django/DRF, usa JWT en cookies HttpOnly y protege operaciones mutables con CSRF (`X-CSRF-TOKEN`).

## Stack principal

- Frontend: React 19, TypeScript, Vite, Bun.
- Backend: Django 5+, Django REST Framework.
- Datos: MySQL (runtime local) y Redis.
- Infra local: Docker Compose.

## Levantar rapido

### Opcion recomendada: Docker

```bash
git clone https://github.com/Luis-Ant/SIRES.git
cd SIRES

cp .env.example .env
docker compose up --build
```

Notas del contrato docker-first de desarrollo:
- Sin compatibilidad legacy de configuracion en backend (MySQL por env en Docker).
- Seed automatico al iniciar contenedores (`backend/seed_e2e.py`).
- Persistencia activa de datos en volumen nombrado `mysql_data`.

Verificacion rapida:
- Frontend: `http://localhost:5173`
- Backend (admin): `http://localhost:5000/admin/`

### Opcion local (sin Docker)

No recomendada. El contrato operativo de desarrollo en SIRES es docker-first.

## Flujo IA del equipo

### Agent Teams Lite

- Orquestacion por subagentes para tareas de implementacion y analisis.
- Flujo SDD para cambios grandes: propuesta -> spec -> design -> tasks -> apply -> verify.
- Trabajo por dominios con ownership explicito para reducir colisiones en paralelo.
- Reglas operativas y jerarquia en `AGENTS.md`.

### Engram

- Memoria compartida de equipo para decisiones, fixes y hallazgos clave.
- Convencion de proyectos: `SIRES_SHARED` (equipo) y `SIRES_LOCAL` (notas locales).
- Sync automatico con hooks Git para export/import de memoria compartida.
- Topic key estable por dominio o feature para mantener trazabilidad real.

### GGA

- Code review asistido por IA en pre-commit.
- Config repo-local de GGA en `.gga/gga/config`.
- Ruleset de GGA en `.gga/rules.md`.
- Hook activo en `.githooks/pre-commit`.

### Jira

- Planeacion y trazabilidad con Epics/Tasks por dominio.
- Cada PR debe referenciar ticket Jira y estado del flujo SDD.

## Baseline operativo Fase 1 (cerrado)

- Modelo operativo oficial: **monolito modular evolutivo** con estrategia de datos **DB por dominio en PostgreSQL**.
- Flujo de entrega obligatorio: **Jira -> SDD -> implementacion por dominio -> Engram -> GGA -> PR/Merge**.
- No se ejecutan movimientos big-bang `old -> new`; runtime actual sigue activo mientras avanza la migracion incremental.
- El refactor funcional de Auth se planifica despues de Fase 1, con tickets Jira y criterios de aceptacion explicitos.

## Modelo operativo por dominios

- Estrategia vigente: monolito modular evolutivo (6-12 meses), sin big-bang ni migracion a microservicios full.
- Refactor integral activo por dominios completos (datos, diseno, DB y enfoque tecnico).
- Base incremental creada en `backend/domains/` y `frontend/src/domains/` sin romper runtime actual.
- Politica de datos obligatoria: `DB por dominio` en PostgreSQL (aislamiento logico ahora, aislamiento fisico cuando cumpla criterios).
- Regla de integracion: no acceso directo cross-domain a tablas/esquemas; la integracion entre dominios se hace por API, eventos o read-models.
- Reglas de dependencias, ownership DB y governance documentadas en `docs/README.md`.

## Flujo diario recomendado

1. Levanta entorno (`docker compose up --build`).
2. Implementa siguiendo el AGENTS mas especifico del area.
3. Corre checks minimos: `bun lint`, `bun test`, `python manage.py test`.
4. Guarda decisiones/fixes relevantes en Engram (`SIRES_SHARED`).
5. Commitea: pre-commit ejecuta GGA antes de cerrar el cambio.

Playbook y onboarding:
- `docs/getting-started/ai-team-workflow.md`
- `docs/getting-started/onboarding-day-1-checklist.md`
- `docs/getting-started/github-hardening-ci-cd-baseline.md`

## Comandos utiles

```bash
# Docker
docker compose up --build
docker compose logs -f
docker compose down

# Reset explicito de datos (solo cuando lo necesites)
docker compose down -v

# Frontend
cd frontend && bun lint
cd frontend && bun test

# Backend
cd backend && python manage.py test
```

## Documentacion

- `docs/README.md` - indice general
- `docs/architecture/domain-map.md` - mapa de dominios y ownership
- `docs/architecture/context-map.md` - bounded contexts y relaciones
- `docs/architecture/dependency-rules.md` - reglas de dependencia y anti-colision
- `docs/architecture/repo-navigation-map.md` - navegacion del repo por capas
- `docs/architecture/db-ownership-migration-policy.md` - ownership DB + politica de migraciones
- `docs/guides/pr-merge-governance.md` - politica de PR/merge
- `docs/guides/domain-dor-dod.md` - DoR/DoD por dominio
- `docs/guides/incremental-domain-migration.md` - estrategia old -> new
- `docs/getting-started/onboarding-day-1-checklist.md` - checklist day-1 IA-first
- `docs/api/README.md` - contratos API
- `docs/guides/ai-skills-matrix.md` - matriz de skills
- `AGENTS.md` - reglas operativas y jerarquia
