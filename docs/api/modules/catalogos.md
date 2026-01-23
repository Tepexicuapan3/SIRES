# API Catalogos - Contratos

Este documento define el contrato de los catalogos del sistema (CRUD).
La fuente de verdad es `docs/api/standards.md`.

Reglas clave
- Endpoints y responses siguen `docs/api/standards.md`.
- Campos en camelCase (ingles).
- Responses sin `message` en exito (salvo `SuccessResponse`).

Base URL
```
http://localhost:5000/api/v1
```

---

## Estructura comun (todos los catalogos)

Cada catalogo debe implementar el mismo set de endpoints y contratos:

| Metodo | Ruta | Request | Response |
| --- | --- | --- | --- |
| GET | `/<catalogo>` | `ListParams` | `ListResponse` |
| GET | `/<catalogo>/:id` | - | `DetailResponse` |
| POST | `/<catalogo>` | `CreateRequest` | `CreateResponse` |
| PUT | `/<catalogo>/:id` | `UpdateRequest` | `UpdateResponse` |
| DELETE | `/<catalogo>/:id` | - | `SuccessResponse` |

**Notas de contrato**
- `ListResponse` usa `ListResponse<T>` (items, page, pageSize, total, totalPages).
- `DetailResponse` envuelve la entidad con clave singular (`center`, `area`, etc.).
- `CreateResponse` devuelve `id` y `name` como minimo.

---

## Catalogo: Centros de Atencion

Incluye clinicas, hospitales y sanatorios.

Endpoints
| Metodo | Ruta | Request | Response | Permiso |
| --- | --- | --- | --- | --- |
| GET | `/care-centers` | `CentrosAtencionListParams` | `CentrosAtencionListResponse` | `admin:gestion:centros_atencion:read` |
| GET | `/care-centers/:id` | - | `CentroAtencionDetailResponse` | `admin:gestion:centros_atencion:read` |
| POST | `/care-centers` | `CreateCentroAtencionRequest` | `CreateCentroAtencionResponse` | `admin:gestion:centros_atencion:create` |
| PUT | `/care-centers/:id` | `UpdateCentroAtencionRequest` | `UpdateCentroAtencionResponse` | `admin:gestion:centros_atencion:update` |
| DELETE | `/care-centers/:id` | - | `DeleteCentroAtencionResponse` | `admin:gestion:centros_atencion:delete` |

Tipos
- `frontend/src/api/types/catalogos/centros-atencion.types.ts`

---

## Catalogo: Areas

Endpoints
| Metodo | Ruta | Request | Response | Permiso |
| --- | --- | --- | --- | --- |
| GET | `/areas` | `AreasListParams` | `AreasListResponse` | `admin:gestion:areas:read` |
| GET | `/areas/:id` | - | `AreaDetailResponse` | `admin:gestion:areas:read` |
| POST | `/areas` | `CreateAreaRequest` | `CreateAreaResponse` | `admin:gestion:areas:create` |
| PUT | `/areas/:id` | `UpdateAreaRequest` | `UpdateAreaResponse` | `admin:gestion:areas:update` |
| DELETE | `/areas/:id` | - | `DeleteAreaResponse` | `admin:gestion:areas:delete` |

Tipos
- `frontend/src/api/types/catalogos/areas.types.ts`
