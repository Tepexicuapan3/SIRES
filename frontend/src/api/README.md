# API Layer - SIRES Frontend

> **Fuente de verdad de contratos:** [`docs/api/standards.md`](../../../docs/api/standards.md)  
> **Documentacion centralizada:** [`docs/api/README.md`](../../../docs/api/README.md)

Capa de transporte de datos del frontend. Comunica la aplicación con el backend de SIRES.

---

## 📂 Estructura de Archivos

```
api/
├── client.ts                 # Configuración Axios + interceptores
├── README.md                 # Esta documentación
│
├── interceptors/
│   ├── request.interceptor.ts    # X-Request-ID, X-CSRF-TOKEN
│   └── error.interceptor.ts      # Refresh token, ApiError
│
├── utils/
│   └── errors.ts                 # Clase ApiError, códigos de error
│
├── resources/                    # Definición de Endpoints
│   ├── auth.api.ts               # Login, Logout, Reset Password
│   ├── users.api.ts              # CRUD Usuarios
│   ├── roles.api.ts              # CRUD Roles
│   ├── permissions.api.ts        # Gestión de Permisos
│   └── clinicas.api.ts           # Catálogo Clínicas
│
└── types/                        # Contratos de Datos (TypeScript)
    ├── index.ts                  # Barrel export
    ├── common.types.ts           # Paginación, respuestas estándar
    ├── auth.types.ts             # Login, sesión, recovery
    ├── users.types.ts            # Usuarios, roles asignados, overrides
    ├── roles.types.ts            # Roles, permisos asignados
    ├── permissions.types.ts      # Catálogo permisos, overrides
    └── clinicas.types.ts         # Catálogo clínicas
```

---

## 🏛️ Arquitectura

### Cliente HTTP (`client.ts`)
Configuración centralizada de Axios:
- **Seguridad:** Cookies HttpOnly + Header CSRF (`X-CSRF-TOKEN`)
- **Refresh Token:** Renovación silenciosa en errores 401
- **Trazabilidad:** Header `X-Request-ID` en cada petición

### Recursos (`resources/*.api.ts`)
Módulos que mapean 1:1 con endpoints del backend:
- ✅ Tipar peticiones/respuestas, llamar a `client.ts`
- ❌ No transforman datos ni contienen lógica de negocio

### Tipos (`types/*.types.ts`)
Contratos TypeScript que definen la forma de los datos:
- Todos los campos usan **camelCase** (inglés)
- IDs genéricos (`id`) no específicos (`idUsuario`)

---

## 📏 Estándares Principales

| Estándar | Archivo | Descripción |
|----------|---------|-------------|
| **Nomenclatura** | `standards.md` | camelCase en API, snake_case en BD |
| **Responses** | `standards.md` | Estructura de listados, errores, void responses |
| **Error Codes** | `standards.md` | Códigos de error consistentes |
| **Pagination** | `standards.md` | Params y response structure |
| **Cache Strategy** | `standards.md` | Estrategia de TanStack Query |

---

## 🛡️ Seguridad

### Autenticación (HttpOnly Cookies)
El frontend **NO** tiene acceso a los JWT. Viajan en cookies HttpOnly:
- ❌ No leer `document.cookie` para buscar tokens
- ❌ No guardar tokens en `localStorage`/`sessionStorage`

### Protección CSRF
Mutaciones (`POST`, `PUT`, `PATCH`, `DELETE`) requieren token CSRF:
- Backend envía cookie `csrf_token` (legible por JS)
- `request.interceptor.ts` inyecta header `X-CSRF-TOKEN`

---

## 🔄 Cache Management (TanStack Query)

### Estrategia Principal

| Tipo de Operación | Response | Cache Strategy |
|-------------------|----------|----------------|
| **Crear (POST)** | Minimalista: `{id, name}` | **Invalidar** query de listado |
| **Actualizar datos (PUT/PATCH)** | Recurso completo | **Invalidar** query de detalle + listado |
| **Eliminar (DELETE)** | `SuccessResponse` vacío | **Invalidar** query de listado |
| **Sub-recursos** (roles, overrides, permissions) | `{parentId, lista[]}` | **Sync optimista** + respuesta |

### Query Keys Estándar

```typescript
// Usuarios
["users", params]              // Lista paginada
["users", userId]              // Detalle completo
["users", userId, "roles"]     // Roles asignados

// Roles
["roles", params]              // Lista paginada
["roles", roleId]              // Detalle completo
["roles", roleId, "permissions"]  // Permisos asignados

// Sesión
["me"]                         // Usuario actual (/auth/me)
```

> Ver [`standards.md`](./standards.md) > **Estándar 9** para ejemplos completos de implementación de hooks.

---

## 📋 Checklist de Implementación

Antes de implementar un nuevo endpoint:

- [ ] Definir tipos en `types/*.types.ts`
- [ ] Crear función en `resources/*.api.ts`
- [ ] Actualizar `types/index.ts` (barrel export)
- [ ] Documentar en `standards.md` si introduce nuevos patrones
- [ ] Implementar hook con estrategia de cache correcta
- [ ] Probar happy path y edge cases

---

## 📚 Documentación Relacionada

| Documento | Descripción | Publico |
|-----------|-------------|---------|
| [`docs/api/standards.md`](../../../docs/api/standards.md) | Estandares globales de API | Backend + Frontend |
| [`docs/api/README.md`](../../../docs/api/README.md) | Indice de documentacion API | Backend + Frontend |

---

## 🔗 Links Externos

- [TanStack Query](https://tanstack.com/query/latest)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/)

---

## 🤝 Contribuciones

Para agregar nuevos endpoints:

1. **Definir tipos** en el archivo correspondiente en `types/`
2. **Crear la función** en `resources/`
3. **Actualizar barrel export** en `types/index.ts`
4. **Documentar cambios** en `standards.md` si es necesario

No modifiques `client.ts` ni los interceptores a menos que sea absolutamente necesario.
