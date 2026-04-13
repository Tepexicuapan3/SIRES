# Catalogos - Contrato Frontend (React + TypeScript)

Este documento describe el contrato que recibe el frontend para catalogos (`/api/v1/*`), alineado con `docs/api/standards.md` y `docs/api/modules/catalogos.md`.

## Resumen

- Base URL: `http://localhost:5000/api/v1`
- Recurso base: `/<recurso-catalogo>`
- Estructura comun CRUD para todos los catalogos
- `wrapper_key` de detalle/update definido por catalogo (`area`, `careCenter`, `authorizer`, etc.)
- Fechas: ISO 8601 en UTC con sufijo `Z`
- Codigos custom por catalogo (`exists` / `not_found`)
- Scope: catalogos de dominio; contratos RBAC/Auth se mantienen en modulos separados

## Endpoints y permisos

| Metodo | Ruta | Permiso |
| --- | --- | --- |
| GET | `/<recurso-catalogo>` | `admin:catalogos:<catalog>:read` |
| GET | `/<recurso-catalogo>/:id` | `admin:catalogos:<catalog>:read` |
| POST | `/<recurso-catalogo>` | `admin:catalogos:<catalog>:create` |
| PUT | `/<recurso-catalogo>/:id` | `admin:catalogos:<catalog>:update` |
| DELETE | `/<recurso-catalogo>/:id` | `admin:catalogos:<catalog>:delete` |

Nota: permisos `admin:gestion:*` (RBAC/usuarios/roles/permisos) no forman parte de este modulo.

## Ejemplo concreto: Areas

- Recurso: `/areas`
- `catalog`: `areas`
- `wrapper_key`: `area`
- Codigos:
  - `exists`: `AREAS_EXISTS`
  - `not_found`: `AREAS_NOT_FOUND`

## Headers esperados

- Siempre:
  - `Accept: application/json`
  - `X-Request-ID: <uuid>`
- Mutaciones (`POST`, `PUT`, `DELETE`):
  - `Content-Type: application/json`
  - `X-CSRF-TOKEN: <token>`
- Auth:
  - Cookies JWT (`credentials: include`)

## Parametros de listado (`GET /<recurso-catalogo>`)

- `page` (int, default `1`, minimo `1`)
- `pageSize` (int, default `20`, rango `1..100`)
- `search` (string, busqueda por `name`, case-insensitive)
- `isActive` (`"true" | "false"`)
- `sortBy` (`"name" | "isActive"`)
- `sortOrder` (`"asc" | "desc"`)

## Formato de fechas (UTC `Z`)

El backend debe enviar `createdAt` y `updatedAt` en formato ISO 8601 UTC, por ejemplo:

- `2025-01-19T14:30:00Z`
- `2025-01-20T09:12:00.123Z`

Para frontend TypeScript, modelalo como string UTC y validalo en runtime.

## Tipos TypeScript

El siguiente bloque muestra tipos base + ejemplo concreto para `areas`.

```ts
// frontend/src/api/types/catalogos/<catalog>.types.ts

export type SortOrder = "asc" | "desc";

// Fecha ISO 8601 en UTC (termina en Z)
export type UtcIsoString = string;

export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: Record<string, string[]>;
  requestId?: string;
  timestamp?: string;
}

export interface UserRef {
  id: number;
  name: string;
}

export interface ListResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// LIST item (GET /areas)
export interface AreaListItem {
  id: number;
  name: string;
  isActive: boolean;
  code: number;
}

// DETAIL item (GET /areas/:id)
export interface AreaDetail {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: UtcIsoString;
  createdBy: UserRef | null;
  updatedAt: UtcIsoString | null;
  updatedBy: UserRef | null;
  code: number;
}

export interface AreasListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "isActive";
  sortOrder?: SortOrder;
}

export type AreasListResponse = ListResponse<AreaListItem>;

export interface AreaDetailResponse {
  area: AreaDetail; // wrapper_key = "area"
}

export interface CreateAreaRequest {
  name: string;
  code: number;
  isActive?: boolean;
}

export interface CreateAreaResponse {
  id: number;
  name: string;
}

export type UpdateAreaRequest = Partial<CreateAreaRequest>;

export interface UpdateAreaResponse {
  area: AreaDetail; // wrapper_key = "area"
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

// Helpers de runtime para consumir fechas UTC en React/TS
export const UTC_ISO_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

export function isUtcIsoString(value: string): value is UtcIsoString {
  return UTC_ISO_REGEX.test(value);
}

export function parseUtcIso(value: UtcIsoString): Date {
  return new Date(value);
}
```

## Ejemplos de response

```json
// GET /api/v1/areas?page=1&pageSize=20&sortBy=name&sortOrder=asc
{
  "items": [
    { "id": 1, "name": "Urgencias", "isActive": true, "code": 10 },
    { "id": 2, "name": "Consulta Externa", "isActive": true, "code": 20 }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 2,
  "totalPages": 1
}
```

```json
// GET /api/v1/areas/1
{
  "area": {
    "id": 1,
    "name": "Urgencias",
    "isActive": true,
    "createdAt": "2025-01-19T14:30:00Z",
    "createdBy": { "id": 7, "name": "Admin SISEM" },
    "updatedAt": null,
    "updatedBy": null,
    "code": 10
  }
}
```

```ts
// Ejemplo de consumo en frontend (React + TypeScript)
import type { AreaDetailResponse } from "./areas.types";
import { isUtcIsoString, parseUtcIso } from "./areas.types";

async function loadArea(id: number): Promise<AreaDetailResponse> {
  const res = await fetch(`/api/v1/areas/${id}`, {
    headers: {
      Accept: "application/json",
      "X-Request-ID": crypto.randomUUID(),
    },
    credentials: "include",
  });

  const data = (await res.json()) as AreaDetailResponse;

  if (!isUtcIsoString(data.area.createdAt)) {
    throw new Error("createdAt no viene en UTC con Z");
  }

  const createdAtDate = parseUtcIso(data.area.createdAt);
  console.log(createdAtDate.toISOString());

  return data;
}
```

```json
// POST /api/v1/areas
// body: { "name": "Laboratorio", "code": 30, "isActive": true }
{
  "id": 3,
  "name": "Laboratorio"
}
```

```json
// PUT /api/v1/areas/3
// body: { "name": "Laboratorio Central" }
{
  "area": {
    "id": 3,
    "name": "Laboratorio Central",
    "isActive": true,
    "createdAt": "2025-01-19T14:30:00Z",
    "createdBy": { "id": 7, "name": "Admin SISEM" },
    "updatedAt": "2025-01-20T09:12:00Z",
    "updatedBy": { "id": 12, "name": "Supervisor" },
    "code": 30
  }
}
```

```json
// DELETE /api/v1/areas/3
{
  "success": true
}
```

```json
// Ejemplo error 409 (duplicado)
{
  "code": "AREAS_EXISTS",
  "message": "Duplicado",
  "status": 409,
  "details": { "name": ["Duplicado"] },
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Patron comun backend (todos los catalogos)

Estas reglas aplican a todos los `*ListCreateView` y `*DetailView` basados en las clases:

- `GET /<recurso>`
  - Respuesta: `ListResponse<T>`
  - Shape: `{ items, page, pageSize, total, totalPages }`
  - Validaciones query:
    - `page` y `pageSize` enteros (`INVALID_FORMAT` si no)
    - `page >= 1` y `1 <= pageSize <= 100`
    - `sortBy` valido segun `sort_map`
    - `sortOrder` en `asc | desc`
    - `isActive` en `true | false`

- `POST /<recurso>`
  - Body con serializer de escritura (`write_serializer`)
  - Error de validacion: `VALIDATION_ERROR`
  - Duplicado por `name`: codigo `error_codes.exists`
  - Exito: `{ id, name }`

- `GET /<recurso>/:id`
  - Exito: `{ <wrapper_key>: <detail> }`
  - No encontrado: codigo `error_codes.not_found`

- `PUT /<recurso>/:id`
  - Actualizacion parcial (`partial=True`)
  - Exito: `{ <wrapper_key>: <detail> }`
  - Errores: `VALIDATION_ERROR`, `error_codes.exists`, `error_codes.not_found`

- `DELETE /<recurso>/:id`
  - Soft delete (`is_active=false`, `deleted_at`, `deleted_by_id`)
  - Exito: `{ "success": true }`
  - No encontrado: `error_codes.not_found`

Todas las respuestas de error siguen `ApiError`:

```json
{
  "code": "...",
  "message": "...",
  "status": 400,
  "details": {},
  "requestId": "..."
}
```

## Matriz de catalogos implementados

| Catalog (`catalog`) | Recurso REST | `wrapper_key` | `exists` code | `not_found` code |
| --- | --- | --- | --- | --- |
| `areas` | `/areas` | `area` | `AREAS_EXISTS` | `AREAS_NOT_FOUND` |
| `autorizadores` | `/authorizers` | `authorizer` | `AUTHORIZER_STUDIES_EXISTS` | `AUTHORIZER_NOT_FOUND` |
| `bajas` | `/discharge-reasons` | `dischargeReason` | `DISCHARGE_REASON_EXISTS` | `DISCHARGE_REASON_NOT_FOUND` |
| `calidad_laboral` | `/labor-quality` | `laborQuality` | `LABOR_QUALITY_EXISTS` | `LABOR_QUALITY_NOT_FOUND` |
| `centros_atencion` | `/care-centers` | `careCenter` | `CARE_CENTER_EXISTS` | `CARE_CENTER_NOT_FOUND` |
| `consultorios` | `/consulting-rooms` | `consultingRoom` | `CONSULTING_ROOM_EXISTS` | `CONSULTING_ROOM_NOT_FOUND` |
| `edo_civil` | `/civil-status` | `civilStatus` | `CIVIL_STATUS_EXISTS` | `CIVIL_STATUS_NOT_FOUND` |
| `enfermedades` | `/diseases` | `disease` | `DISEASE_EXISTS` | `DISEASE_NOT_FOUND` |
| `escolaridad` | `/education-level` | `educationLevel` | `EDUCATION_LEVEL_EXISTS` | `EDUCATION_LEVEL_NOT_FOUND` |
| `escuelas` | `/schools` | `school` | `SCHOOL_EXISTS` | `SCHOOL_NOT_FOUND` |
| `especialidades` | `/specialties` | `specialty` | `SPECIALTY_EXISTS` | `SPECIALTY_NOT_FOUND` |
| `estudios_med` | `/med-studies` | `medicalStudy` | `MEDICAL_STUDIES_EXISTS` | `MEDICAL_STUDIES_NOT_FOUND` |
| `grupos_medicamentos` | `/med-groups` | `medicationGroup` | `MED_GROUP_EXISTS` | `MED_GROUP_NOT_FOUND` |
| `ocupaciones` | `/occupations` | `occupation` | `OCCUPATIONS_EXISTS` | `OCCUPATIONS_NOT_FOUND` |
| `origen_cons` | `/consultation-origins` | `consultationOrigin` | `CONSULTATION_ORIGIN_EXISTS` | `CONSULTATION_ORIGIN_NOT_FOUND` |
| `parentescos` | `/kinship` | `kinship` | `KINSHIP_EXISTS` | `KINSHIP_NOT_FOUND` |
| `pases` | `/passes` | `pass` | `PASS_EXISTS` | `PASS_NOT_FOUND` |
| `tipos_areas` | `/area-types` | `areaType` | `AREA_TYPE_EXISTS` | `AREA_TYPE_NOT_FOUND` |
| `tp_autorizacion` | `/auth-types` | `authorizationType` | `AUTH_TYPE_STUDIES_EXISTS` | `AUTH_TYPE_NOT_FOUND` |
| `tipo_citas` | `/appointment-types` | `appointmentType` | `APPOINTMENT_TYPE_EXISTS` | `APPOINTMENT_TYPE_NOT_FOUND` |
| `licencias` | `/licenses` | `license` | `LICENSE_EXISTS` | `LICENSE_NOT_FOUND` |
| `tipos_sanguineo` | `/blood-type` | `bloodType` | `BLOOD_TYPE_EXISTS` | `BLOOD_TYPE_NOT_FOUND` |
| `turnos` | `/shifts` | `shift` | `SHIFT_EXISTS` | `SHIFT_NOT_FOUND` |

## Payload completo por catalogo (variables)

Notas de tipos para frontend:

- `createdBy`, `updatedBy`, `user`: `UserRef | null` (`{ id, name }`)
- `center`, `authorizationType`, `turn`: `CatalogRef | null` (`{ id, name }`)
- `createdAt`, `updatedAt`: `UtcIsoString` (UTC con `Z`)
- `schedule`: objeto JSON (definir interfaz propia en frontend si aplica)

| Recurso | Fields de `GET /<recurso>` (items) | Fields de `GET /<recurso>/:id` (wrapper) | Fields de `POST/PUT` (body) |
| --- | --- | --- | --- |
| `/care-centers` | `id, name, code, isExternal, isActive` | `id, name, code, isExternal, address, schedule, isActive, createdAt, createdBy, updatedAt, updatedBy` (`careCenter`) | `name, code, isExternal, address, schedule, isActive` |
| `/areas` | `id, name, isActive, code` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy, code` (`area`) | `name, code, isActive` |
| `/authorizers` | `id, name, isActive` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy, position, center, authorizationType, signatureImage, user, fileNumber` (`authorizer`) | `name, isActive, centerId, position, authorizationTypeId, signatureImage, authorizerPassword, userId, fileNumber` |
| `/discharge-reasons` | `id, name, isActive` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy` (`dischargeReason`) | `name, isActive` |
| `/labor-quality` | `id, name, isActive` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy` (`laborQuality`) | `id, name, isActive` |
| `/consulting-rooms` | `id, name, isActive, code` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy, code, turn, center` (`consultingRoom`) | `name, isActive, code, idTurn, idCenter` |
| `/civil-status` | `id, name, isActive` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy` (`civilStatus`) | `name, isActive` |
| `/diseases` | `id, name, isActive` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy` (`disease`) | `name, isActive, code, cieVersion` |
| `/education-level` | `id, name, isActive` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy` (`educationLevel`) | `name, isActive` |
| `/schools` | `id, name, isActive, code` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy, code` (`school`) | `name, code, isActive` |
| `/specialties` | `id, name, isActive` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy` (`specialty`) | `name, isActive` |
| `/med-studies` | `id, name, isActive, code` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy, code` (`medicalStudy`) | `name, isActive, studyType, indication` |
| `/med-groups` | `id, name, isActive` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy` (`medicationGroup`) | `name, isActive` |
| `/occupations` | `id, name, isActive` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy` (`occupation`) | `name, isActive` |
| `/consultation-origins` | `id, name, isActive` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy` (`consultationOrigin`) | `id, name, isActive` |
| `/kinship` | `id, name, isActive` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy` (`kinship`) | `id, name, isActive` |
| `/passes` | `id, name, isActive` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy` (`pass`) | `name, isActive` |
| `/area-types` | `id, name, isActive` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy` (`areaType`) | `name, isActive` |
| `/auth-types` | `id, name, isActive, code` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy, code` (`authorizationType`) | `name, isActive, code` |
| `/appointment-types` | `id, name, isActive` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy` (`appointmentType`) | `name, isActive` |
| `/licenses` | `id, name, isActive` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy` (`license`) | `name, isActive` |
| `/blood-type` | `id, name, isActive` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy` (`bloodType`) | `name, isActive` |
| `/shifts` | `id, name, isActive` | `id, name, isActive, createdAt, createdBy, updatedAt, updatedBy` (`shift`) | `name, isActive` |

## Template TypeScript reutilizable por catalogo

```ts
export interface CatalogListItem {
  id: number | string;
  name: string;
  isActive: boolean;
}

export interface CatalogDetail extends CatalogListItem {
  createdAt: UtcIsoString;
  createdBy: UserRef | null;
  updatedAt: UtcIsoString | null;
  updatedBy: UserRef | null;
}

export interface CatalogDetailResponse<TWrapperKey extends string, TDetail> {
  [K in TWrapperKey]: TDetail;
}
```

## Referencias

- `docs/api/standards.md`
- `docs/api/modules/catalogos.md`
- `docs/api/modules/rbac.md`
- `docs/architecture/domain-map.md`
- `docs/architecture/dependency-rules.md`
- `docs/architecture/db-ownership-migration-policy.md`
- `docs/getting-started/ai-team-workflow.md`
