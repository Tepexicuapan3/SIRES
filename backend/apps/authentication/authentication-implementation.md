# Authentication API - Implementacion

Esta carpeta implementa el modulo de autenticacion siguiendo el contrato
`auth-API.md`. El objetivo es mantener la misma estructura de carpetas
(`middlewares`, `repositories`, `services`, `uses_case`) y separar
responsabilidades.

## Estructura

- `views.py`: controladores HTTP (validacion, manejo de errores, cookies).
- `serializers.py`: validaciones de entrada por endpoint.
- `repositories/user_repository.py`: acceso a datos y mapeo a `AuthUser`.
- `services/`: utilidades de seguridad (tokens, CSRF, OTP, respuestas).
- `uses_case/`: logica de negocio por endpoint.

## Respuestas (standards)

- Las respuestas usan camelCase e ingles.
- El objeto `user` expone `id`, `username`, `fullName`, `email`,
  `primaryRole`, `landingRoute`, `roles`, `permissions`,
  `mustChangePassword`, `requiresOnboarding`.

## Endpoints implementados

- `POST /api/v1/auth/login`
  - Valida credenciales y devuelve `user` + `requiresOnboarding`.
  - Setea `access_token`, `refresh_token`, `csrf_token` en cookies.

- `POST /api/v1/auth/logout`
  - Requiere sesion activa y CSRF valido.
  - Limpia cookies de autenticacion.

- `GET /api/v1/auth/me`
  - Devuelve el `AuthUser` actual.

- `GET /api/v1/auth/verify`
  - Responde `{ valid: true|false }` segun token.

- `POST /api/v1/auth/refresh`
  - Usa `refresh_token` de cookie para rotar tokens.

- `POST /api/v1/auth/complete-onboarding`
  - Cambia contrasena temporal y acepta terminos.
  - Retorna nuevo `AuthUser` y re-emite tokens.

- `POST /api/v1/auth/request-reset-code`
  - Genera OTP en cache y envia correo (placeholder).
  - Siempre retorna 200 para evitar enumeracion.

- `POST /api/v1/auth/verify-reset-code`
  - Valida OTP y setea `reset_token` en cookie.

- `POST /api/v1/auth/reset-password`
  - Usa `reset_token` para actualizar contrasena y re-emite tokens.

## Cookies utilizadas

- `access_token`: HttpOnly, Path=/api, Max-Age=900
- `refresh_token`: HttpOnly, Path=/api/v1/auth/refresh, Max-Age=604800
- `csrf_token`: Secure, Path=/, Max-Age=900
- `reset_token`: HttpOnly, Path=/api/v1/auth/reset-password, Max-Age=600

## Notas de seguridad

- No se envian tokens en el body.
- CSRF se valida comparando `X-CSRF-TOKEN` con `csrf_token`.
- OTP se guarda en cache con TTL y limite de intentos.
- Los errores siguen el contrato `{ success, error, message, details }`.

## Tests

Ejecutar tests del modulo:

```bash
python manage.py test apps.authentication.tests
```
