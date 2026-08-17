.PHONY: setup setup-auth-demo setup-auth-full reset-db reset-db-demo reset-db-full seed-auth-base seed-auth-demo seed-auth-edge seed-auth-factory test-seed-auth-command validate-auth-access-bootstrap deploy-frontend deploy-portal deploy-backend deploy-backend-migrate deploy-full deploy-env deploy-proxy backup-db

AUTH_FACTORY_USERS ?= 50

setup:
	docker compose up -d auth-db redis backend
	docker compose exec backend python manage.py setup_auth_access_local

setup-auth-demo:
	docker compose up -d auth-db redis backend
	docker compose exec backend python manage.py setup_auth_access_local --with-demo

setup-auth-full:
	docker compose up -d auth-db redis backend
	docker compose exec backend python manage.py setup_auth_access_local --with-demo --with-edge-cases --factory-users $(AUTH_FACTORY_USERS)

seed-auth-base:
	docker compose exec backend python manage.py seed_auth_access --base

seed-auth-demo:
	docker compose exec backend python manage.py seed_auth_access --demo

seed-auth-edge:
	docker compose exec backend python manage.py seed_auth_access --edge-cases

seed-auth-factory:
	docker compose exec backend python manage.py seed_auth_access --factory-users $(AUTH_FACTORY_USERS)

test-seed-auth-command:
	docker compose exec backend python manage.py test apps.authentication.tests.test_seed_auth_access_command

validate-auth-access-bootstrap:
	$(MAKE) setup-auth-full AUTH_FACTORY_USERS=$(AUTH_FACTORY_USERS)
	$(MAKE) test-seed-auth-command

reset-db:
	docker compose down -v
	docker compose up -d auth-db redis backend
	docker compose exec backend python manage.py setup_auth_access_local

reset-db-demo:
	docker compose down -v
	docker compose up -d auth-db redis backend
	docker compose exec backend python manage.py setup_auth_access_local --with-demo

reset-db-full:
	docker compose down -v
	docker compose up -d auth-db redis backend
	docker compose exec backend python manage.py setup_auth_access_local --with-demo --with-edge-cases --factory-users $(AUTH_FACTORY_USERS)

# ── Deploy a produccion ──────────────────────────────────────────────────────
# Ninguno de estos targets usa "down -v" ni toca volumenes: auth_db_data,
# expedientes_db_data, redis_data y celery_beat_data quedan siempre intactos.

backup-db:
	docker compose exec -T auth-db sh -c 'pg_dump -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" -F c -f /tmp/backup_pre_deploy.dump'
	docker cp sisem_postgres:/tmp/backup_pre_deploy.dump ./backup_pre_deploy_$(shell date +%Y%m%d_%H%M%S).dump

deploy-frontend:
	git pull
	docker compose build frontend
	docker compose up -d frontend

deploy-portal:
	git pull
	docker compose build portal-frontend
	docker compose up -d portal-frontend

deploy-backend:
	git pull
	docker compose build backend celery-worker celery-beat
	docker compose up -d backend celery-worker celery-beat

# Como deploy-backend, pero saca un backup de auth-db antes de aplicar
# migraciones nuevas, y se queda mirando los logs para confirmar que
# "Applying <migracion>... OK" aparece sin errores (Ctrl+C para salir).
deploy-backend-migrate: backup-db
	git pull
	docker compose build backend celery-worker celery-beat
	docker compose up -d backend celery-worker celery-beat
	docker compose logs -f backend

deploy-full:
	git pull
	docker compose build
	docker compose up -d

# Solo cambio de variables en .env, sin cambios de codigo -- no hace falta
# build, pero si --force-recreate para que los contenedores tomen los
# valores nuevos.
deploy-env:
	docker compose up -d --force-recreate backend celery-worker celery-beat frontend portal-frontend

deploy-proxy:
	docker compose restart proxy
