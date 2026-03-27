# Frontend API Layer (SIRES)

Capa de transporte del frontend: contratos, recursos HTTP y manejo de errores.

## Fuente de Verdad

- Contratos globales API: `docs/api/standards.md`
- Indice API docs: `docs/api/README.md`
- Reglas de agente para esta carpeta: `frontend/src/infrastructure/api/AGENTS.md`

## Estructura Actual

```txt
frontend/src/infrastructure/api/
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
- La logica de negocio critica no va en esta capa; debe vivir en hooks/casos de uso de dominio.

## Part 2 operativo

- Integracion inter-dominio: esta capa consume contratos API explicitos; no se puentean limites con imports internos entre dominios.
- Realtime: solo por excepcion y en adapters/modulos dedicados con contrato claro de canal/auth/mensaje.
- Permisos: exponer capacidades atomicas del backend; no inferir seguridad por role strings en cliente.
- Auditoria: propagar metadatos de trazabilidad (`X-Request-ID`) cuando el contrato lo requiera.

## Part 3 operativo

- Mantener wording DB consistente: backend opera hoy sobre PostgreSQL unico con ownership por dominio y aislamiento logico; la separacion fisica se evalua despues por criterio.
- No modelar recursos cliente asumiendo joins/atajos cross-domain de DB; exigir composicion por contrato backend explicito.
- En endpoints criticos, reflejar en contratos cliente expectativas de idempotencia, concurrencia y manejo transaccional.
- Si cambia un contrato critico o limite entre dominios, actualizar docs/DoD relacionados en el mismo PR.
- Testing por riesgo en esta capa: priorizar auth/authz de transporte, `X-Request-ID`, errores normalizados y mutaciones sensibles a concurrencia.

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
- [ ] Confirmar que no se agrego logica de negocio critica en cliente API.
- [ ] Cubrir con pruebas los caminos criticos segun riesgo del contrato.
- [ ] Actualizar docs/DoD si el contrato cambia limites o comportamiento critico.

## Comandos

```bash
cd frontend
bun lint
bun test
```
