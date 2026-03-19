# API Standards - SIRES

> TL;DR: Estandares transversales para contratos REST consumidos por frontend. Priorizar consistencia de recursos, errores, seguridad y versionado.

## Scope

- Aplica a `docs/api/modules/*.md`.
- Debe mantenerse alineado con `backend/apps/**` y `frontend/src/api/**`.

## 1) Versionado y rutas

- Prefijo oficial: `/api/v1/`.
- Diseñar recursos como sustantivos (`/users`, `/roles`, `/catalogos`).
- Usar verbos HTTP semanticos:
  - `GET`: lectura
  - `POST`: creacion
  - `PUT/PATCH`: actualizacion
  - `DELETE`: eliminacion

## 2) Contrato minimo por endpoint

Cada endpoint documentado debe incluir:

- Metodo y path.
- Requisitos de auth/permisos.
- Requisito CSRF para mutaciones (`X-CSRF-TOKEN`).
- Request schema.
- Response schema.
- Status codes esperados.
- Ejemplo request/response copy-paste.

## 3) Convenciones de payload

- Respuestas para frontend en `camelCase`.
- Campos internos de DB pueden mantenerse en `snake_case` dentro del backend.
- Fechas en ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`).
- Para listados, explicitar paginacion (`items`, `page`, `pageSize`, `total`, `totalPages`).

## 4) Contrato de error (obligatorio)

Forma recomendada:

```json
{
  "code": "USER_NOT_FOUND",
  "message": "User not found",
  "status": 404,
  "details": {},
  "requestId": "req-123"
}
```

Reglas:

- `code` es estable y machine-readable.
- `message` es seguro para usuario (sin leaks internos).
- `status` debe reflejar el HTTP real.
- `details` y `requestId` son opcionales pero recomendados.

## 5) Seguridad de transporte

- JWT en cookies HttpOnly.
- No exponer tokens en localStorage/sessionStorage.
- Mutaciones deben incluir `X-CSRF-TOKEN`.

## 6) Criterios de cambios de contrato

- Cambios incompatibles requieren versionado o plan de transicion.
- Cualquier cambio en error codes o schema debe actualizar docs del modulo.
- Si impacta multiples dominios, documentar RFC cross-domain.

## References

- `docs/api/README.md`
- `docs/api/AGENTS.md`
- `docs/templates/rfc-cross-domain-template.md`
