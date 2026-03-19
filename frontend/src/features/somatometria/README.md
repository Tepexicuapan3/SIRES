# Feature Somatometria

Modulo clinico para captura de signos vitales y liberacion de visita.

## Estado actual

- Ruta productiva: `clinico/somatometria`
- Entrada canonica: `modules/captura/pages/SomatometriaCapturePage.tsx`
- Logica de captura en este feature:
  - `modules/captura/domain/capture-vitals.schemas.ts`
  - `modules/captura/queries/useSomatometriaQueue.ts`
  - `modules/captura/mutations/useCaptureVitals.ts`

## Compatibilidad

- Compatibilidad legacy removida: usar imports directos de `features/somatometria/modules/captura/*`.

## UI objetivo

- Formulario minimalista para captura segura con campos esenciales: `weightKg`, `heightCm`, `temperatureC`, `oxygenSaturationPct`.
- Mantiene selector de visita (folio/estado) e IMC calculado dentro del flujo principal.
