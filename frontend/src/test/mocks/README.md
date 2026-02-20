# MSW Mocks (Frontend)

Configuracion de Mock Service Worker para desarrollo offline y tests de frontend.

## Estructura

```txt
frontend/src/test/mocks/
├── handlers/
│   ├── auth.ts
│   ├── users.ts
│   ├── roles.ts
│   ├── permissions.ts
│   ├── areas.ts
│   └── centros-atencion.ts
├── handlers.ts
├── browser.ts
└── server.ts
```

## Uso

- Navegador (dev): `browser.ts`.
- Tests Vitest: `server.ts` se levanta desde `frontend/src/test/setup.ts`.
- Registro central de handlers: `handlers.ts`.

## Principios

- Mantener respuestas mock compatibles con `docs/api/standards.md`.
- Mantener codigos/mensajes de error coherentes con backend.
- Evitar mocks que oculten errores reales de contrato.

## Escenarios de Auth

Implementados en `handlers/auth.ts`:

- Login exitoso por roles (`admin`, `clinico`, `recepcion`, etc.).
- Escenarios de error (`INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `USER_INACTIVE`, etc.).
- Recovery/reset/onboarding con casos de token y password fuerte/debil.

## Cuando agregar un handler nuevo

1. Crear archivo en `handlers/`.
2. Registrar en `handlers.ts`.
3. Cubrir con test de integracion.
4. Actualizar docs si cambia un contrato.
