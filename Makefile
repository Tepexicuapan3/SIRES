.PHONY: setup setup-auth-demo setup-auth-full reset-db reset-db-demo reset-db-full seed-auth-base seed-auth-demo seed-auth-edge seed-auth-factory test-seed-auth-command validate-auth-access-bootstrap

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
