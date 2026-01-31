# AGENTS.md - Backend (Django/DRF) Operating Guide

Este backend es un proyecto Django con DRF. La idea es mantener una arquitectura por capas: las views orquestan HTTP, los serializers validan/transforman, los use cases contienen la logica de negocio, y los repositories encapsulan acceso a datos.

## Stack actual

- Django + Django REST Framework.
- Auth: JWT (SimpleJWT) pero transportado por cookies HttpOnly.
- DB: configurado para MySQL en `backend/config/settings.py`.
- CORS: `corsheaders`.

Nota: `backend/requirements.txt` esta en UTF-16.

## Estructura del proyecto

- `backend/config/`: settings y ruteo global.
- `backend/apps/<modulo>/`: apps Django (por dominio).
- `backend/apps/<modulo>/views.py`: capa HTTP (DRF APIView).
- `backend/apps/<modulo>/serializers.py`: validacion/shape de request/response.
- `backend/apps/<modulo>/uses_case/`: logica de negocio (funciones usecase).
- `backend/apps/<modulo>/repositories/`: acceso a datos (ORM + queries).
- `backend/apps/<modulo>/services/`: servicios puros (tokens, csrf, otp, email, etc).
- `backend/infrastructure/`: integraciones (cache/email/seguridad). Puede haber placeholders.

## Convenciones de API

- Prefijo: hoy se publica `apps.authentication` bajo `api/v1/` en `backend/config/urls.py`.
- Rutas sin trailing slash (ej: `/api/v1/auth/login`). Mantener consistente.
- Contratos JSON: se usa camelCase en responses (ej: `requiresOnboarding`, `fullName`).
- Errores estandar: usar `apps.authentication.services.response_service.error_response()`.
  Payload tipico:
  - `code`, `message`, `status`, `timestamp`, opcional `details`, opcional `requestId`.
- Trazabilidad: si llega header `X-Request-ID`, incluirlo en errores (`requestId`).

## Autenticacion (importante)

Este proyecto usa JWT en cookies:

- Cookies:
  - `access_token` (HttpOnly, path `/api`)
  - `refresh_token` (HttpOnly, path `/api/v1/auth/refresh`)
  - `csrf_token` (NO HttpOnly, path `/`)
  - `reset_token` (HttpOnly, path `/api/v1/auth/reset-password`)
- CSRF custom:
  - Frontend debe mandar `X-CSRF-TOKEN` y debe matchear con cookie `csrf_token`.
  - Se valida con `apps.authentication.services.csrf_service.validate_csrf()`.
- Autorizacion de sesion:
  - Para endpoints protegidos, se valida cookie `access_token` con
    `apps.authentication.services.session_service.authenticate_request()`.

Ojo: en `apps.authentication.services.token_service` las cookies se setean con `secure=True` y `samesite="Strict"`.

## Auditoria

- Se registra auditoria via `apps.authentication.services.audit_service.log_event()`.
- Los eventos se guardan en `apps.administracion.models.AuditoriaEvento`.

## Como agregar un endpoint nuevo

1) Serializer (input/output)
- Agregar en `backend/apps/<app>/serializers.py`.

2) Use case
- Implementar en `backend/apps/<app>/uses_case/<algo>_usecase.py`.
- Aca va la logica de negocio. Idealmente sin dependencias de DRF.

3) Repository (si hace falta)
- Implementar en `backend/apps/<app>/repositories/`.
- Encapsular queries ORM, joins, transacciones.

4) View
- Implementar en `backend/apps/<app>/views.py` usando `APIView`.
- Manejar:
  - validacion serializer
  - auth (`authenticate_request`) si aplica
  - CSRF (`validate_csrf`) en endpoints con efecto (POST/PUT/PATCH/DELETE)
  - manejo de errores con `AuthServiceError` (u otro error de dominio) + `error_response`
  - auditoria si corresponde

5) URLs
- Definir rutas en `backend/apps/<app>/urls.py`.
- Incluir el modulo desde `backend/config/urls.py` bajo `api/v1/`.

## Modelos y DB

- Muchos modelos usan nombres y columnas en espanol (ej: `fch_alta`, `usr_modf`) y `db_column=`.
- Mantener consistencia con el esquema existente.

## Cache / rate limiting

- Login y OTP usan `django.core.cache`.
- Para prod, configurar `CACHES` (idealmente Redis). En tests se usa `LocMemCache` via `override_settings`.

## Tests

- Hoy los tests estan con el runner de Django/DRF (`APITestCase`).
- Ejecutar:
  - `python manage.py test`

## Comandos utiles

- Correr server: `python manage.py runserver`
- Migraciones: `python manage.py makemigrations` y `python manage.py migrate`
- Tests: `python manage.py test`

## Gotchas del repo

- Hay carpetas de apps con nombres raros (ej: `backend/apps/consulta medica/`). Evitar espacios en nombres nuevos.
- `REST_FRAMEWORK` esta configurado con `JWTAuthentication`, pero el flujo real de auth usa cookies + `authenticate_request()`.
- `backend/config/settings.py` tiene `SECRET_KEY` hardcodeado: para prod mover a env (`python-decouple`).
