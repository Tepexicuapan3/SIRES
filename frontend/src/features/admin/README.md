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
- Logica de negocio critica y reglas de permisos en `domain/` (no en utilidades UI).

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
- Mover logica de negocio/orquestacion a `domain/`, `queries/` o `mutations/`.
- Dejar `utils/` para helpers tecnicos puros (formateo, mapeos sin reglas).
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

## Guardrails Part 2 (operativo)

- Coordinacion con otros dominios solo por contratos/adapters/eventos documentados.
- Realtime es excepcion controlada: handlers/subs delegan decisiones de negocio a `queries/`, `mutations/` o `domain/`.
- Acciones administrativas sensibles deben mantener metadata de correlacion para auditoria backend (ej. `X-Request-ID` cuando aplique).
- Validaciones de permiso en UI son gating UX; autorizacion real la define backend con permisos atomicos/policies.

## Guardrails Part 3 (operativo)

- Diseñar contratos admin asumiendo politica DB vigente: PostgreSQL unico operativo hoy, ownership por dominio y aislamiento logico estricto; la separacion fisica va despues por criterio.
- Si cambia un limite funcional, contrato o dependencia de permisos, actualizar docs/DoD relacionados en el mismo PR.
- Testing por riesgo: priorizar dependencias de permisos, estados degradados, mutaciones sensibles y escenarios de concurrencia en listados/edicion.
- Evolucion por etapas: endurecer modulo actual antes de rediseños amplios; evitar cambios por moda.
- Riesgos top a evitar: checks de seguridad por role string, reglas de negocio en helpers UI y flujos criticos sin pruebas.

## Flujo de Datos

`UI -> queries/mutations -> frontend/src/api/resources -> backend`

## Patrones recomendados (cuando usar)

- Use Cases/Hooks de aplicacion para orquestar flujos con multiples pasos.
- Repositories/wrappers de API solo cuando haya necesidad real de consistencia entre multiples recursos.
- Policies/dependencias para permisos contextuales (`usePermissionDependencies`).
- Evitar complejidad prematura: no introducir patrones tipo CQRS/event sourcing en este nivel.

## Checklist de Nuevo Modulo Admin

- [ ] Crear `queries/` y `mutations/` con keys propias.
- [ ] Definir `components/`, `domain/`, `utils/` segun necesidad.
- [ ] Integrar permisos y estados de acceso degradado.
- [ ] Asegurar manejo de loading/empty/error.
- [ ] Agregar o actualizar tests de UI/comportamiento.
- [ ] Mantener integraciones cross-domain via contratos/adapters/eventos.
- [ ] Si hay realtime, evitar logica critica en handlers.
- [ ] Verificar trazabilidad de auditoria para acciones sensibles.
- [ ] Cubrir con pruebas automatizadas los caminos criticos segun riesgo.
- [ ] Actualizar docs/DoD cuando cambian limites o contratos.
