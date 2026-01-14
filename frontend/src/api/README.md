# API Layer - Frontend

> **Documentación de Arquitectura:** [`docs/architecture/authentication.md`](../../../docs/architecture/authentication.md)

Este directorio contiene la capa de transporte de datos del frontend. Su única responsabilidad es comunicar la aplicación con el backend de SIRES, manejando la seguridad y el tipado de datos.

---

## 🏛️ Arquitectura y Responsabilidades

### 1. Cliente HTTP (`client.ts`)
Configuración centralizada de **Axios** que maneja:
*   **Seguridad:** Cookies `HttpOnly` (automático con `withCredentials: true`) y Header CSRF (`X-CSRF-TOKEN`).
*   **Manejo de Errores:** Normalización de errores y redirección en sesión expirada.
*   **Refresh Token:** Interceptor que renueva el token silenciosamente en errores 401.

### 2. Recursos (`resources/*.api.ts`)
Módulos "tontos" que mapean 1:1 con los endpoints del backend.
*   **✅ LO QUE HACEN:** Tipar peticiones/respuestas, llamar a `client.ts`.
*   **❌ LO QUE NO HACEN:** Transformar datos, agrupar, filtrar o contener lógica de negocio.
    *   *La transformación de datos pertenece a la capa de Hooks (React Query).*

---

## 📏 Estándares de Respuesta (Backend Contract)

El frontend está diseñado para consumir dos tipos de estructuras de respuesta, dependiendo de la naturaleza del endpoint.

### A. Endpoints de Colección (Listas/Tablas)
Usados para obtener múltiples registros (ej: Usuarios, Clínicas, Roles, Permisos).
**Siempre** retornan un **Wrapper con Metadatos**, independientemente de si son 10 o 10,000 registros.

```typescript
// GET /api/v1/users?page=1
interface CollectionResponse<T> {
  items: T[];       // Array de datos
  total: number;    // Total de registros en BD
  page: number;     // Página actual
  page_size: number;// Registros por página
  total_pages: number;
}
```
*   **Uso en Tablas:** Se consume `response.items` y `response.page/total`.
*   **Uso en Selects:** Se consume `response.items` (ignorando metadata).

### B. Endpoints Singulares (Operacionales/Detalle)
Usados para obtener una sola entidad o el resultado de una operación específica.
Retornan el objeto directo o un wrapper semántico específico.

```typescript
// GET /api/v1/users/1
interface UserDetailResponse {
  user: User;
  roles: UserRole[];
}

// POST /api/v1/auth/login
interface LoginResponse {
  user: User;
  requires_onboarding: boolean;
}
```

---

## 🛡️ Seguridad y Buenas Prácticas

### Autenticación (HttpOnly Cookies)
El frontend **NO** tiene acceso a los JWT (Access/Refresh Tokens). Estos viajan en cookies `HttpOnly` gestionadas por el navegador.
*   **Prohibido:** Intentar leer `document.cookie` para buscar tokens.
*   **Prohibido:** Guardar tokens en `localStorage` o `sessionStorage` (Vulnerabilidad XSS).

### Protección CSRF
Las mutaciones (`POST`, `PUT`, `PATCH`, `DELETE`) requieren un token CSRF.
*   El backend envía una cookie `csrf_access_token` (legible por JS).
*   `client.ts` lee esta cookie y la inyecta en el header `X-CSRF-TOKEN`.

---

## 🧪 Mocking (MSW)

El proyecto utiliza **Mock Service Worker (MSW)** para interceptar peticiones a nivel de red durante desarrollo y tests.
*   No existe lógica condicional en el código (`if (USE_MOCKS) ...`).
*   Los recursos (`auth.api.ts`) siempre llaman a la URL real.
*   MSW intercepta el tráfico si está activo.

Activar mocks en `.env`:
```bash
VITE_USE_MOCKS=true
```

---

## 📂 Estructura de Archivos

```
api/
├── client.ts              # Core Axios + Interceptores
├── README.md              # Esta documentación
│
├── resources/             # Definición de Endpoints
│   ├── auth.api.ts        # Login, Logout, Reset Password
│   ├── users.api.ts       # CRUD Usuarios (Wrapper Paginado)
│   ├── roles.api.ts       # CRUD Roles (Wrapper Paginado)
│   ├── permissions.api.ts # CRUD Permisos (Wrapper Paginado)
│   └── clinicas.api.ts    # Catálogo Clínicas
│
└── types/                 # Contratos de Datos (TypeScript)
    ├── auth.types.ts
    ├── users.types.ts
    ├── roles.types.ts
    ├── permissions.types.ts
    └── clinicas.types.ts
```
