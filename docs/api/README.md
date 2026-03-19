# API Docs - SIRES

Documentacion de contratos REST consumidos por frontend y otros clientes internos.

## Fuente de Verdad

- Estandares globales: `docs/api/standards.md`
- Modulos por dominio: `docs/api/modules/*.md`
- Implementacion real: `backend/apps/**`

Si hay desalineacion entre docs y codigo, corregir primero el contrato o implementar ajuste con plan explicito; no mantener divergencia silenciosa.

## Estructura

```txt
docs/api/
├── README.md
├── standards.md
└── modules/
    ├── auth.md
    ├── rbac.md
    ├── catalogos.md
    └── doc_front.md
```

## Reglas de Contrato

- Prefijo de rutas: `api/v1/`
- Metodos HTTP semanticos (`GET`, `POST`, `PATCH`, `DELETE`)
- Requests mutantes con CSRF (`X-CSRF-TOKEN`)
- Responses de error consistentes:
  - `code`, `message`, `status`, opcional `details`, opcional `requestId`
- Campos expuestos al frontend en `camelCase`

## Flujo de Mantenimiento

1. Ajustar `docs/api/standards.md` si cambia una regla transversal.
2. Ajustar el modulo afectado en `docs/api/modules/`.
3. Verificar coherencia con:
   - `frontend/src/api/resources/`
   - `frontend/src/api/types/`
   - `backend/apps/**`
4. Agregar ejemplo request/response cuando se introduce un contrato nuevo.

## Enlaces Relacionados

- Reglas de docs API para agentes: `docs/api/AGENTS.md`
- Guia general de documentacion: `docs/README.md`
