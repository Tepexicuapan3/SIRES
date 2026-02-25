# Recepcion Operacion UI/UX

> TL;DR: Recepcion trabaja con una superficie principal (Agenda) y una superficie de ejecucion (Check-in), con foco en informacion operativa minima y acciones seguras por servicio.

## Problem / Context

Recepcion necesita operar rapido en escenarios de alta carga sin exponer informacion clinica que no aporta a su rol.

Riesgos detectados:

- Sobrecarga de UI por mezclar seguimiento y ejecucion en bloques sin jerarquia.
- Errores operativos por validaciones tardias o falta de contexto.
- Fragmentacion por servicio (general, especialidad, urgencias) sin un modelo comun.

## Solution / Implementation

### Superficies

- `Agenda`: monitoreo, priorizacion, filtros y contexto del turno.
- `Check-in`: ejecucion de registro de llegada y acciones de recepcion.

### Informacion minima visible

- Folio, paciente, tipo de llegada, servicio, estado, cita, doctor.
- Alertas operativas de bloqueo (duplicado, estado invalido, permisos).

### Acciones permitidas

- Registrar llegada con cita y sin cita.
- Marcar `cancelada` y `no_show` con confirmacion.
- Derivar al flujo clinico siguiente segun estado.

### Modelo por servicio

- Medicina general: flujo programado, default con cita.
- Especialidad: flujo programado, validacion de cita/referencia.
- Urgencias: flujo inmediato, forzado a `walk_in`.

## Examples

### Rutas principales

- `/recepcion/agenda`
- `/recepcion/checkin`

### Mapeo operativo

```txt
Agenda      -> leer y priorizar
Check-in    -> ejecutar y confirmar
```

### Fases de implementacion ejecutadas

1. Contratos compartidos (servicios, permisos, formato).
2. Rutas y estructura de feature de recepcion.
3. Agenda con filtros por estado/tipo/servicio y metricas.
4. Check-in rapido desde Agenda (dialog) + Check-in completo.
5. Reglas por servicio centralizadas.
6. Manejo de errores de dominio y refresco de cola en conflictos.

## References

- `frontend/src/features/recepcion/README.md`
- `frontend/src/features/recepcion/shared/domain/recepcion.services.ts`
- `frontend/src/features/recepcion/modules/agenda/pages/RecepcionAgendaPage.tsx`
- `frontend/src/features/recepcion/modules/checkin/pages/RecepcionCheckinPage.tsx`
