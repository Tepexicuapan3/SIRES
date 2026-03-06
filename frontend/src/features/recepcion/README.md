# Recepcion

Feature dedicada para operacion de recepcion.

## Modulos

- `modules/agenda/`: panel operativo para monitoreo de llegadas y estado de atencion.
- `modules/checkin/`: adaptadores de compatibilidad legacy y mutaciones del flujo.

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

- Compatibilidad legacy removida: usar imports directos de `features/recepcion/modules/*`.
- La ruta legacy `/recepcion/checkin` redirige a `/recepcion/agenda?focus=checkin`.
- Las rutas legacy `/recepcion/agendar-cita` y `/recepcion/fichas/*` redirigen a `/recepcion/agenda?focus=checkin`.

## Modelo operativo

- `agenda`: experiencia unica de recepcion con dashboard, filtros, cola y generacion de fichas.
- `checkin`: alias legacy que redirige a `agenda` con foco de check-in.

## Definition of Done

- Recepcion opera con filtros por estado, tipo de llegada y servicio.
- Permisos de lectura/escritura bloquean consultas/acciones no autorizadas sin UX ruidosa.
- Errores de dominio tienen mensajes accionables y fallback consistente.
- La ruta oficial es `/recepcion/agenda`.
- Legacy soportado: `/recepcion/checkin`, `/recepcion/agendar-cita` y `/recepcion/fichas/*` redirigen a `/recepcion/agenda?focus=checkin`.
