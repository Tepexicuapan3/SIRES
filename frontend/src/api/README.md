# Frontend API Layer (SIRES)

Capa de transporte del frontend: contratos, recursos HTTP y manejo de errores.

## Fuente de Verdad

- Contratos globales API: `docs/api/standards.md`
- Indice API docs: `docs/api/README.md`
- Reglas de agente para esta carpeta: `frontend/src/api/AGENTS.md`

## Estructura Actual

```txt
frontend/src/api/
├── client.ts
├── interceptors/
│   ├── request.interceptor.ts
│   └── error.interceptor.ts
├── resources/
│   ├── auth.api.ts
│   ├── users.api.ts
│   ├── roles.api.ts
│   ├── permissions.api.ts
│   └── catalogos/
│       ├── areas.api.ts
│       └── centros-atencion.api.ts
├── types/
│   ├── auth.types.ts
│   ├── users.types.ts
│   ├── roles.types.ts
│   ├── permissions.types.ts
│   ├── common.types.ts
│   └── catalogos/
│       ├── areas.types.ts
│       └── centros-atencion.types.ts
└── utils/
    ├── errors.ts
    └── request-id.ts
```

## Reglas de Arquitectura

- UI no hace HTTP directo; solo consume hooks/servicios que usan `resources/`.
- `resources/` define llamadas y contratos de transporte (sin logica de negocio).
- `types/` centraliza tipos API para evitar duplicacion.
- `utils/errors.ts` normaliza errores para consumo consistente en features.

## Seguridad

- Auth basada en cookies HttpOnly (no tokens en localStorage/sessionStorage).
- Mutaciones usan CSRF por header `X-CSRF-TOKEN` via interceptor.
- Requests agregan trazabilidad con `X-Request-ID`.

## Error Handling

Los errores deben mapearse a una forma consistente para UI y hooks.

Forma esperada:

```json
{
  "code": "SOME_ERROR_CODE",
  "message": "Human readable message",
  "status": 400,
  "details": {},
  "requestId": "optional"
}
```

## Checklist para Nuevo Endpoint

- [ ] Definir tipos en `types/`.
- [ ] Crear funcion en `resources/`.
- [ ] Normalizar errores en consumo.
- [ ] Verificar contrato contra `docs/api/`.
- [ ] Agregar/ajustar tests en `frontend/src/test/`.

## Comandos

```bash
cd frontend
bun lint
bun test
```
