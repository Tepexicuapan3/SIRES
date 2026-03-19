# Setup SIRES

> TL;DR: Levantar SIRES con Docker es el camino oficial. El stack operativo usa Django/DRF + React 19 sobre MySQL + Redis en contenedores.

## Prerequisitos

- Docker + Docker Compose
- Git

## Opcion recomendada: Docker

1. Clonar repositorio:

```bash
git clone https://github.com/Luis-Ant/SIRES.git
cd SIRES
```

2. Crear env desde ejemplo:

```bash
cp .env.example .env
```

3. Levantar servicios:

```bash
docker compose up --build
```

Notas clave del entorno docker-first:
- Backend usa MySQL por variables de entorno (`DB_ENGINE`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
- El seed demo (`backend/seed_e2e.py`) se ejecuta automaticamente en el arranque (`RUN_SEED_ON_BOOT=true`).
- La data persiste en volumen Docker (`mysql_data`).

4. Verificacion rapida:

- Frontend: `http://localhost:5173`
- Backend admin: `http://localhost:5000/admin/`

5. Logs utiles:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

## Opcion local (sin Docker)

No recomendada. La configuracion soportada para el equipo es docker-first.

## Comandos operativos frecuentes

```bash
# Docker
docker compose up --build
docker compose down

# Reset explicito de datos (solo cuando se requiere limpiar DB)
docker compose down -v
docker compose logs -f

# Frontend
cd frontend && bun lint
cd frontend && bun test

# Backend
cd backend && python manage.py test
```

## Troubleshooting rapido

### El frontend no conecta al backend

- Verificar `VITE_API_URL` en `.env`.
- Verificar puerto backend (`5000`) y estado del contenedor.

### El backend no levanta

- Revisar `.env` y credenciales de MySQL (`MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`).
- Revisar logs: `docker compose logs -f backend mysql`.

### Hooks o gates no activos

- Ejecutar `./.engram/scripts/install-hooks.sh`.
- Confirmar `core.hooksPath`:

```bash
git config --get core.hooksPath
```

## References

- `docs/getting-started/ai-team-workflow.md`
- `docs/getting-started/onboarding-day-1-checklist.md`
- `docs/architecture/overview.md`
