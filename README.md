# SIRES

Sistema de Informacion de Registros Electronicos de Salud (Metro CDMX).

## Snapshot

- Frontend: React 19 + TypeScript + Vite + Bun.
- Backend: Django 6 + Django REST Framework.
- Data: MySQL 8 + Redis.
- Seguridad: JWT en cookies HttpOnly + CSRF (`X-CSRF-TOKEN`).
- Infra local: Docker Compose.

## Quick Start

### 1) Requisitos

- Docker y Docker Compose.
- Bun (solo si vas a correr frontend fuera de Docker).
- Python 3.11+ (solo si vas a correr backend fuera de Docker).

### 2) Levantar entorno con Docker (recomendado)

```bash
git clone https://github.com/Luis-Ant/SIRES.git
cd SIRES

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

docker-compose up --build -d
```

### 3) Verificar

- Frontend: `http://localhost:5173`
- Backend (admin): `http://localhost:5000/admin/`

## Servicios Locales

| Servicio | Puerto por defecto | Notas |
| --- | --- | --- |
| Frontend | `5173` | Vite dev server |
| Backend | `5000` | Django runserver |
| MySQL | `3306` | Base principal |
| Redis | `6379` | Cache y OTP |

## Comandos de Desarrollo

### Docker

```bash
docker-compose up -d
docker-compose up -d --build
docker-compose logs -f
docker-compose down
```

### Frontend (local)

```bash
cd frontend
bun install
bun dev
bun lint
bun test
```

### Backend (local)

```bash
cd backend
python manage.py migrate
python manage.py runserver 0.0.0.0:5000
python manage.py test
```

## Testing

- Frontend unit/integration: `cd frontend && bun test`
- Frontend coverage: `cd frontend && bun run test:coverage`
- Frontend E2E: `cd frontend && bunx playwright test`
- Backend tests: `cd backend && python manage.py test`

## Estructura del Proyecto

```txt
SIRES/
├── backend/
│   ├── apps/
│   ├── config/
│   ├── infrastructure/
│   ├── tests/
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── features/
│   │   ├── routes/
│   │   └── test/
│   └── package.json
├── docs/
│   ├── api/
│   ├── architecture/
│   ├── guides/
│   └── README.md
├── AGENTS.md
└── docker-compose.yml
```

## Documentacion

- Indice general: `docs/README.md`
- Contratos API: `docs/api/README.md`
- Guia de testing frontend: `frontend/src/test/README.md`
- Guia de API frontend: `frontend/src/api/README.md`

## Matriz Maestra de Skills (IA)

- Matriz completa: `docs/guides/ai-skills-matrix.md`
- Reglas operativas por alcance: `AGENTS.md`

### Resumen rapido (skill -> trigger)

| Skill | Trigger principal |
| --- | --- |
| `vercel-react-best-practices` | Crear/modificar componentes React |
| `interface-design` | Definir layout/UI antes de implementar |
| `web-design-guidelines` | Auditar UX/a11y |
| `typescript` | Escribir tipos/contratos |
| `tailwind-4` | Estilos con Tailwind |
| `zod-4` | Validacion de schemas |
| `zustand-5` | Estado global UI |
| `django-drf` | Implementacion de endpoints DRF |
| `api-design-principles` | Diseno/revision de contratos API |
| `error-handling-patterns` | Contratos de error, retries, fallback |
| `systematic-debugging` | Bugs/regresiones/tests fallando |
| `brainstorming` | Planificacion antes de codear |
| `pytest` | Tests backend |
| `playwright` | E2E |
| `jira-task` | Crear tareas/bugs |
| `jira-epic` | Crear epicas |
| `find-skills` | Descubrir/instalar skills |

## AGENTS Hierarchy (Load Narrow First)

1. `AGENTS.md` (global)
2. `backend/AGENTS.md` o `frontend/AGENTS.md` (dominio)
3. AGENTS especifico de subcarpeta (`backend/apps/AGENTS.md`, `frontend/src/api/AGENTS.md`, etc.)

El archivo mas especifico siempre tiene prioridad sobre el superior.
