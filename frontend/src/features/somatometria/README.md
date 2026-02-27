# Feature Somatometria

Modulo clinico para captura de signos vitales y liberacion de visita.

## Estado actual

- Ruta productiva: `clinico/somatometria`
- Entrada canonicamente enrutable: `modules/captura/pages/SomatometriaCapturePage.tsx`
- Compatibilidad temporal: la implementacion actual sigue en `features/flujo-clinico` mientras termina la migracion incremental.

## Proximo paso sugerido

- Mover query/mutation/esquemas de somatometria a `features/somatometria/modules/captura` y dejar re-exports en `features/flujo-clinico`.
