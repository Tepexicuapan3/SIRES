# Admin Feature

Modulo administrativo de SIRES, organizado por submodulos con estructura repetible.

## Alcance

- Ruta: `frontend/src/features/admin/**`
- Reglas de agente: `frontend/src/features/admin/AGENTS.md`
- Base comun de features: `frontend/src/features/AGENTS.md`

## Principios

- Backend entrega contratos en camelCase (sin adapters en UI).
- UI consume hooks/queries/mutations; no hace HTTP directo.
- Queries y mutations separados por modulo y con keys dedicadas.
- Reutilizable en `shared/`; especifico en `modules/<modulo>/`.

## Estructura

```txt
admin/
├── shared/
│   ├── components/
│   ├── hooks/
│   └── utils/
└── modules/
    ├── rbac/
    ├── catalogos/
    ├── expedientes/
    ├── reportes/
    ├── analiticas/
    ├── estadisticas/
    ├── autorizaciones/
    └── licencias/
```

## Catalogos Actuales

- `modules/catalogos/centros-atencion`
- `modules/catalogos/areas`

## Patrones Recomendados

### Listados CRUD

- Mantener pages delgadas (render + wiring).
- Mover logica pesada a `utils/`.
- Mover definicion de columnas a componentes dedicados.
- Reusar componentes de shell/dialog/shared para evitar duplicacion.

### Detalles CRUD

- Usar shell reutilizable para loading/error/confirmacion.
- Para casos simples, usar una sola seccion.
- Para casos complejos (RBAC), separar en secciones/tabs por responsabilidad.

## Permisos y UX

- Si falta permiso secundario, mostrar aviso contextual neutro (sin banner critico).
- No exponer codigos tecnicos de permiso en UI.
- Deshabilitar solo controles dependientes y mantener data visible cuando sea posible.
- Evitar requests innecesarios con `enabled: false` en queries sin permiso.
- Para escrituras, usar `usePermissionDependencies()` y modo `dependencyAware` cuando aplique.

## Flujo de Datos

`UI -> queries/mutations -> frontend/src/api/resources -> backend`

## Checklist de Nuevo Modulo Admin

- [ ] Crear `queries/` y `mutations/` con keys propias.
- [ ] Definir `components/`, `domain/`, `utils/` segun necesidad.
- [ ] Integrar permisos y estados de acceso degradado.
- [ ] Asegurar manejo de loading/empty/error.
- [ ] Agregar o actualizar tests de UI/comportamiento.
