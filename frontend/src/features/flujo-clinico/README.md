# Flujo Clinico - KAN-26

> TL;DR: Base TDD de UI para recepcion -> somatometria -> doctor, con estados de carga/error/vacio, validaciones clinicas criticas y bloqueo de acciones invalidas por estado.

## Matriz de escenarios KAN-26

### RecepcionQueuePage

- Estados de bandeja: `loading`, `error`, `empty`, `success`.
- Formulario de llegada:
  - `patientId` obligatorio y valido.
  - `appointmentId` obligatorio si `arrivalType=appointment`.
- Acciones de recepcion (`cancelada`, `no_show`) solo habilitadas para `en_espera`.

### SomatometriaCapturePage

- Estados de bandeja: `loading`, `error`, `empty`, `success`.
- Formulario de vitales minimos:
  - `weightKg`, `heightCm`, `temperatureC`, `oxygenSaturationPct` obligatorios.
- Bloqueo de captura si la visita seleccionada no esta en `en_somatometria`.

### DoctorConsultationPage

- Estados de bandeja: `loading`, `error`, `empty`, `success`.
- Flujo clinico:
  - no se puede cerrar consulta sin iniciar etapa `en_consulta`.
  - no se puede cerrar consulta sin `primaryDiagnosis` y `finalNote`.

### Navegacion por etapa

- `VisitStageNavigator` habilita/deshabilita etapas segun `VisitStatus`.
- Reglas de disponibilidad:
  - `en_espera`: solo Recepcion.
  - `en_somatometria`: Recepcion + Somatometria.
  - `lista_para_doctor | en_consulta | cerrada`: todas las etapas.

## Criterios de accesibilidad basicos (KAN-26)

- Cada input critico tiene `Label` asociado con `htmlFor`.
- Errores de validacion se muestran con `role="alert"`.
- Mensajes de feedback no bloqueantes usan `role="status"`.
- Botones deshabilitados en acciones invalidas para evitar flujo inconsistente.
- Navegacion por etapa mantiene semantica de `nav` + `aria-current` en etapa activa.

## Referencias

- `docs/guides/kan4-fase-0-baseline-planeacion.md`
- `docs/guides/kan4-fase-2-implementacion-recepcion-somatometria.md`
- `docs/guides/kan4-fase-3-consulta-y-tiempo-real.md`
