# Feature Consulta Medica

Modulo clinico para atencion del doctor durante consulta.

## Estado actual

- Ruta productiva: `clinico/consultas/doctor`
- Entrada canonica: `modules/atencion/pages/DoctorConsultationPage.tsx`
- Logica de modulo:
  - `modules/atencion/domain/consultation.schemas.ts`
  - `modules/atencion/queries/useDoctorQueue.ts`
  - `modules/atencion/mutations/*`

## Compatibilidad

- Compatibilidad legacy removida: usar imports directos de `features/consulta-medica/modules/atencion/*`.

## UI objetivo

- Vista operacional estilo consulta medica con panel de paciente, tabs clinicos,
  resumen de signos vitales y acciones de guardado/cierre.
