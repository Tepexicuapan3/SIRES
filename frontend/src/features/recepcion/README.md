# Recepcion

Feature dedicada para operacion de recepcion.

## Modulos

- `modules/agenda/`: vista operativa para monitoreo de llegadas y estado de atencion.
- `modules/checkin/`: registro de llegada y acciones de recepcion (`cancelada`, `no_show`).

## Estructura

Cada modulo sigue la base:

```txt
pages/
components/
queries/
mutations/
domain/
utils/
```

## Notas de migracion

- Se mantienen re-exports de compatibilidad en `features/flujo-clinico/` para evitar romper imports antiguos.
- Las rutas legacy `/recepcion/fichas/*` redirigen a `checkin`.

## Modelo operativo

- `agenda`: vista principal para priorizar y monitorear estados por servicio.
- `checkin`: ejecucion de registro de llegada y acciones de estado (`cancelada`, `no_show`).
- `checkin rapido`: disponible desde agenda para registrar llegadas sin cambio de contexto.

## Definition of Done

- Recepcion opera con filtros por estado, tipo de llegada y servicio.
- Permisos de lectura/escritura bloquean consultas/acciones no autorizadas sin UX ruidosa.
- Errores de dominio tienen mensajes accionables y fallback consistente.
- Las rutas nuevas (`/recepcion/agenda`, `/recepcion/checkin`) quedan como entrypoint oficial.
