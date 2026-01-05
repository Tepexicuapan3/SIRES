# API Layer - Frontend

> **Documentación completa:** Ver [`docs/api/`](../../../docs/api/) y [`docs/architecture/authentication.md`](../../../docs/architecture/authentication.md)

Este directorio contiene el cliente HTTP (Axios) y los recursos de API para comunicación con el backend.

---

## Quick Reference

| Tema | Documentación |
|------|---------------|
| **Contratos de API Auth** | [docs/api/auth-endpoints.md](../../../docs/api/auth-endpoints.md) |
| **Arquitectura Auth (cookies HttpOnly + CSRF)** | [docs/architecture/authentication.md](../../../docs/architecture/authentication.md) |
| **Todos los endpoints** | [docs/api/endpoints.md](../../../docs/api/endpoints.md) |

---

## Estructura del Directorio

```
api/
├── client.ts          # Cliente Axios con interceptores
│                      # - Agrega header X-CSRF-TOKEN en mutaciones
│                      # - Refresh automático en 401
│                      # - Normaliza errores a ApiError
│
├── resources/         # Funciones de llamada a endpoints
│   ├── auth.api.ts    # Endpoints de autenticación
│   └── ...            # Otros dominios (users, expedientes, etc.)
│
├── types/             # Tipos TypeScript de request/response
│   ├── auth.types.ts  # Tipos de autenticación
│   └── ...
│
└── mocks/             # Mocks para desarrollo sin backend
    ├── auth.mocks.ts
    └── ...
```

---

## Cliente HTTP (client.ts)

### Configuración Base

| Propiedad      | Valor                          |
| -------------- | ------------------------------ |
| Base URL       | `env.apiUrl` (variable .env)   |
| Timeout        | 30,000 ms (30 segundos)        |
| Content-Type   | `application/json`             |
| Accept         | `application/json`             |
| withCredentials| `true` (envía cookies automáticamente) |

### Interceptores

#### Request Interceptor

```typescript
// Agrega header CSRF en mutaciones (POST, PUT, PATCH, DELETE)
const csrfToken = getCookie("csrf_access_token");
if (["post", "put", "patch", "delete"].includes(config.method)) {
  config.headers["X-CSRF-TOKEN"] = csrfToken;
}
```

#### Response Interceptor

```typescript
// Refresh automático en 401
if (error.response?.status === 401 && !originalRequest._retry) {
  await axios.post(`${env.apiUrl}/auth/refresh`, {}, { withCredentials: true });
  return apiClient(originalRequest); // Retry request original
}
```

Ver implementación completa en [docs/architecture/authentication.md](../../../docs/architecture/authentication.md#refresh-automático-401).

---

## Patrón Strategy: API Real vs Mocks

El módulo usa el patrón **Strategy** para alternar entre la API real y mocks:

```typescript
// auth.api.ts
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";
export const authAPI = USE_MOCKS ? authMocks : realAuthAPI;
```

### Activar Mocks

```bash
# En .env.local
VITE_USE_MOCKS=true
```

Ver [docs/guides/testing.md](../../../docs/guides/testing.md) para detalles del sistema de mocks.

---

## Ejemplo de Uso

### Llamada a API Auth

```typescript
import { authAPI } from "@api/resources/auth.api";
import { toast } from "sonner";

try {
  const response = await authAPI.login({ usuario: "admin", clave: "password" });
  // response.user contiene datos del usuario
} catch (error) {
  const apiError = error as ApiError;
  toast.error(apiError.message);
}
```

### Estructura de Error Normalizada

```typescript
interface ApiError {
  code: string;      // "INVALID_CREDENTIALS", "USER_LOCKED", etc.
  message: string;   // Mensaje legible para el usuario
  status: number;    // Código HTTP (401, 403, 500, etc.)
}
```

Ver catálogo completo de códigos de error en [docs/api/auth-endpoints.md#manejo-de-errores](../../../docs/api/auth-endpoints.md#manejo-de-errores).

---

## Agregar Nuevo Resource

1. **Crear archivo de tipos:** `types/nuevo-dominio.types.ts`
   ```typescript
   export interface CreateItemRequest {
     name: string;
   }
   
   export interface Item {
     id: number;
     name: string;
   }
   ```

2. **Crear archivo de resource:** `resources/nuevo-dominio.api.ts`
   ```typescript
   import { apiClient } from "../client";
   import type { CreateItemRequest, Item } from "../types/nuevo-dominio.types";
   
   export const itemsAPI = {
     getAll: async (): Promise<Item[]> => {
       const response = await apiClient.get("/items");
       return response.data;
     },
     
     create: async (data: CreateItemRequest): Promise<Item> => {
       const response = await apiClient.post("/items", data);
       return response.data;
     },
   };
   ```

3. **Usar en componente con TanStack Query:**
   ```typescript
   import { useQuery } from "@tanstack/react-query";
   import { itemsAPI } from "@api/resources/nuevo-dominio.api";
   
   const { data, isLoading } = useQuery({
     queryKey: ["items"],
     queryFn: itemsAPI.getAll,
   });
   ```

---

## Seguridad

### ✅ Lo que ya tenemos

- **Cookies HttpOnly:** Tokens JWT no son accesibles desde JavaScript (XSS no puede robarlos)
- **CSRF Protection:** Header `X-CSRF-TOKEN` en mutaciones (patrón double-submit)
- **Refresh automático:** Interceptor maneja renovación de access token en 401
- **withCredentials:** Cookies se envían automáticamente en cada request

### ❌ NO hacer esto

```typescript
// ❌ NUNCA guardar tokens en localStorage/sessionStorage
localStorage.setItem("access_token", token); // Vulnerable a XSS

// ❌ NUNCA enviar tokens en headers manualmente
config.headers["Authorization"] = `Bearer ${token}`; // Las cookies lo hacen automáticamente

// ❌ NUNCA pasar tokens en URL
fetch(`/api/users?token=${token}`); // Queda en logs del servidor
```

---

## Referencias

- [Arquitectura de Autenticación](../../../docs/architecture/authentication.md) - Flujos completos, cookies HttpOnly + CSRF
- [Contratos de API Auth](../../../docs/api/auth-endpoints.md) - Endpoints, tipos, errores
- [Testing con Mocks](../../../docs/guides/testing.md) - Sistema de mocks y usuarios de prueba
- [Guía de Testing](../../../docs/guides/testing.md#api-mocks) - Cómo crear y usar mocks

---

**Última actualización:** Enero 2026
