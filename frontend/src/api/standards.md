# API Standards - SIRES Frontend

> **TL;DR:** Este documento define los estándares GLOBALES que el frontend espera del backend.
> El backend DEBE cumplir con estos contratos. Estos son la FUENTE DE VERDAD.

> **Estado:** Draft - En proceso de definición durante refactorización
> **Última actualización:** 2025-01-16

---

## 🎯 Contexto

SIRES es un sistema médico crítico del Metro CDMX que maneja:
- Datos clínicos de pacientes
- Permisos y roles de usuarios
- Historial médico
- Recetas y prescripciones

**Características:**
- **CRÍTICO en seguridad:** Datos de salud (ePHI) bajo regulaciones HIPAA
- **CRÍTICO en disponibilidad:** Sistema en producción 24/7
- **ENORME en escala:** Múltiples módulos médicos, cientos de endpoints
- **Multi-tenant:** Múltiples clínicas y roles

---

## 📏 Estándar 1: Nomenclatura

### Regla General

| Capa | Formato | Ejemplo | Justificación |
|-------|----------|-----------|---------------|
| **Frontend (Types, UI)** | camelCase | `idUsuario`, `nombreCompleto`, `correoElectronico` | Idiomático JavaScript/TypeScript, estándar de la industria |
| **Backend (API)** | camelCase | `idUsuario`, `nombreCompleto`, `correoElectronico` | Machea frontend sin adapters, simplifica integración |
| **Base de Datos** | snake_case | `id_usuario`, `nombre_completo`, `correo_electronico` | MySQL, adapters en backend para convertir |

### Reglas Específicas

1. **IDs:** Siempre usar `id` genérico en API (no `idUsuario`, `idRol`, etc.)
   - DB: `id_usuario`, `id_rol`
   - API/Frontend: `id`
   - **Razón:** Simplificar frontend, solo hay un campo `id` en todas las entidades

2. **Fechas:** Usar nombres descriptivos
   - ❌ Mal: `fecha_nac`, `fecha_ing`, `fecha_mod`
   - ✅ Bien: `fechaNacimiento`, `fechaIngreso`, `fechaModificacion`

3. **Booleanos:** Prefix `is` para estados
   - ❌ Mal: `active`, `deleted`, `blocked`
   - ✅ Bien: `isActive`, `isDeleted`, `isBlocked`

---

## 📦 Estándar 2: Estructura de Responses

### A. Listados Paginados

```typescript
interface ListResponse<T> {
  items: T[];        // Array de datos
  page: number;        // Página actual (1-based, NO 0-based)
  pageSize: number;     // Items por página (default: 20, max: 100)
  total: number;        // Total de items en BD
  totalPages: number;   // Total de páginas
}
```

### B. Entidad Singular (Sin paginación)

```typescript
// Objeto plano directo
{
  "id": 123,
  "nombre": "Juan",
  "correo": "juan@example.com"
}
```

### C. Void Responses (Acciones sin retorno)

```typescript
interface SuccessResponse {
  success: boolean;   // Siempre true
  message?: string;   // Mensaje opcional para mostrar en UI
}
```

---

## 🚨 Estándar 3: Códigos de Error

### Estructura del Error

```typescript
interface ApiError {
  code: ErrorCode;              // Código custom (descriptivo, NO HTTP status)
  message: string;              // Mensaje user-friendly
  status: number;               // HTTP status code
  details?: Record<string, string[]>; // Errores por campo (para forms)
  requestId?: string;           // Request ID para traceability
  timestamp: Date;              // Cuándo ocurrió el error
}
```

### Códigos de Error Definidos

#### Auth Errors (4xx)
- `INVALID_CREDENTIALS` (400)
- `TOKEN_EXPIRED` (401)
- `TOKEN_INVALID` (401)
- `SESSION_EXPIRED` (401)
- `PERMISSION_DENIED` (403)

#### Validation Errors (400)
- `VALIDATION_ERROR`
- `FIELD_REQUIRED`
- `INVALID_FORMAT`
- `INVALID_EMAIL`
- `INVALID_PASSWORD`

#### Business Logic Errors (4xx)
- `USER_EXISTS` (409)
- `USER_NOT_FOUND` (404)
- `ROLE_NOT_FOUND` (404)
- `PERMISSION_NOT_FOUND` (404)
- `CLINIC_NOT_FOUND` (404)

#### System Errors (5xx)
- `INTERNAL_SERVER_ERROR` (500)
- `DATABASE_ERROR` (500)
- `EXTERNAL_SERVICE_ERROR` (502)

#### Network Errors
- `NETWORK_ERROR` (sin conexión)
- `TIMEOUT_ERROR` (timeout)
- `RATE_LIMIT_EXCEEDED` (429)

---

## 📄 Estándar 4: Paginación

```typescript
interface PaginationParams {
  page?: number;        // Página actual (default: 1, 1-based)
  pageSize?: number;     // Items por página (default: 20, max: 100)
  search?: string;       // Búsqueda libre (opcional)
  sortBy?: string;       // Campo por el cual ordenar
  sortOrder?: 'asc' | 'desc';  // Ordenamiento
}
```

**Reglas:**
- `page` es 1-based (NO 0-based)
- `pageSize` default: 20, máximo: 100
- Búsqueda case-insensitive

---

## 📅 Estándar 5: Fechas

**Formato:** ISO 8601

```json
"2025-01-16T14:30:00Z"  // UTC
```

**Reglas:**
- Backend SIEMPRE UTC
- Frontend convierte a timezone del usuario

---

## 🔑 Estándar 6: IDs

**Regla:** `id` genérico en API

```typescript
// DB: id_usuario, id_rol
// API/Frontend: id
```

---

## 🔒 Estándar 7: Seguridad

### 7.1 Request ID (OBLIGATORIO)
```typescript
X-Request-ID: "550e8400-e29b-41d4-a716-4466554400000"
```

### 7.2 Audit Logs
- Loggear TODOS los requests que accedan a ePHI
- Retención mínima: 6 años

### 7.3 Rate Limiting
```typescript
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1737050000
```

### 7.4 Retry Logic
- Reintentar solo en 5xx, network errors, 429
- Exponential backoff: 1s, 2s, 4s, máx 3 intentos

### 7.5 Timeout
- Default: 30 segundos
- Configurable por endpoint

### 7.6 Encryption
- Reposo: AES-256
- Tránsito: TLS 1.2+
