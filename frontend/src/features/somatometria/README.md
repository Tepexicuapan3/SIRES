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

- Se mantienen re-exports en `features/flujo-clinico` para no romper imports legacy.

## UI objetivo

- Formulario operacional de "Registro de Somatometria" con layout por filas, unidades visibles e IMC calculado.
- Incluye campo de `circunferencia abdominal` alineado al contrato backend/frontend.
