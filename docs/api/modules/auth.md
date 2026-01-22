# API Auth - Contratos

Este documento define los contratos de autenticacion usados por el frontend.
La fuente de verdad es `docs/api/standards.md` y los tipos en
`frontend/src/api/types/auth.types.ts`.

Reglas clave
- JWT en cookies HttpOnly (no tokens en body ni storage).
- CSRF obligatorio en mutaciones (ver `docs/api/standards.md`).
- Errores siguen el formato `ApiError` del estandar.

Base URL
```
http://localhost:5000/api/v1
```

Endpoints
| Metodo | Ruta | Request | Response | Notas |
| --- | --- | --- | --- | --- |
| POST | `/auth/login` | `LoginRequest` | `LoginResponse` | Inicia sesion y devuelve `AuthUser`. |
| POST | `/auth/logout` | - | `LogoutResponse` | Invalida sesion y limpia cookies. |
| GET | `/auth/me` | - | `MeResponse` | Usuario autenticado actual. |
| GET | `/auth/verify` | - | `VerifyTokenResponse` | `valid: true` en 200. |
| POST | `/auth/refresh` | - | `RefreshTokenResponse` | Renueva cookies. |
| POST | `/auth/request-reset-code` | `RequestResetCodeRequest` | `RequestResetCodeResponse` | Envia OTP por email. |
| POST | `/auth/verify-reset-code` | `VerifyResetCodeRequest` | `VerifyResetCodeResponse` | Valida OTP. |
| POST | `/auth/reset-password` | `ResetPasswordRequest` | `ResetPasswordResponse` | Retorna sesion activa. |
| POST | `/auth/complete-onboarding` | `CompleteOnboardingRequest` | `CompleteOnboardingResponse` | Completa onboarding. |

Requests y responses (ejemplos)
```json
// LoginRequest
{
  "username": "jperez",
  "password": "Test123!"
}
```

```json
// LoginResponse
{
  "user": {
    "id": 1,
    "username": "jperez",
    "fullName": "Juan Perez",
    "email": "jperez@metro.cdmx.gob.mx",
    "primaryRole": "ADMIN",
    "landingRoute": "/admin",
    "roles": ["ADMIN"],
    "permissions": ["admin:config:roles:read"],
    "mustChangePassword": false
  },
  "requiresOnboarding": false
}
```

```json
// VerifyTokenResponse
{
  "valid": true
}
```

```json
// VerifyResetCodeResponse
{
  "valid": true
}
```

```json
// SuccessResponse (Logout/Refresh/RequestResetCode)
{
  "success": true,
  "message": "Operacion exitosa"
}
```

Tipos y referencias
- `frontend/src/api/types/auth.types.ts`
- `frontend/src/api/types/common.types.ts`
- `frontend/src/api/resources/auth.api.ts`
