# auth-access - Decision Log

Registro historico de decisiones del dominio con fecha, estado e impacto.

## Formato

| Fecha | ID | Estado | Decision | Impacto |
|---|---|---|---|---|

## Decisiones

| Fecha | ID | Estado | Decision | Impacto |
|---|---|---|---|---|
| 2026-03-23 | AUTH-DEC-001 | Aceptada | La documentacion canonica del dominio pasa a `docs/domains/auth-access/` con `README.md` como hub. | Escalabilidad documental por dominio y menor duplicidad en `docs/guides/`. |
| 2026-03-23 | AUTH-DEC-002 | Aceptada | Los documentos legacy de PRD/pendientes en `docs/guides/` se mantienen temporalmente como stubs de redireccion deprecados. | Compatibilidad de enlaces existentes sin bloquear migracion gradual. |
| 2026-03-23 | AUTH-DEC-003 | Aceptada | Se cierra baseline tecnico AS-IS de `auth_access` en `baseline-as-is.md` como artefacto canonico de KAN-47. | Trazabilidad versionada de estado actual (flujos/modulos/endpoints/permisos/deuda) para desbloquear KAN-48+ sin tocar runtime. |
| 2026-03-23 | AUTH-DEC-004 | Aceptada | Se adopta `boundary-map-acl.md` como source tecnico canonico de fronteras e integraciones ACL de `auth_access` (KAN-48), con guardrails obligatorios para KAN-49/KAN-50/KAN-52. | Enforcement documental unico para evitar acoplamiento cross-domain y mejorar trazabilidad de ejecucion sin tocar runtime. |
| 2026-03-23 | AUTH-DEC-005 | Aceptada | Se centraliza la resolucion runtime de capabilities en backend (`authorization_service`) y se define `deny by default` en frontend cuando existe proyeccion backend de permisos (KAN-49 slice inicial acotado a recepcion). | Fuente unica de cambio para autorizacion efectiva en el slice critico de recepcion y menor riesgo de divergencia entre backend/frontend. |
| 2026-03-24 | AUTH-DEC-006 | Reemplazada | El hardening runtime de enforcement (somatometria/realtime) se reclasifica en KAN-57 para evitar mezcla de alcance con KAN-50. | Se corrige trazabilidad y se elimina ambiguedad entre estrategia DB y runtime hardening. |
| 2026-03-24 | AUTH-DEC-007 | Aceptada | KAN-50 queda acotada a estrategia DB ownership/migracion RBAC (`managed=False`) con plan `expand -> migrate -> contract` y validaciones por fase. | Asegura ejecucion incremental de datos con rollback/control de integridad sin tocar runtime. |
| 2026-03-24 | AUTH-DEC-008 | Aceptada | KAN-51 adopta `X-Request-ID` como contrato transversal obligatorio en auth-access, con preservacion de header entrante, generacion UUID cuando falta y retorno en header/payload de error. | Permite reconstruccion E2E de flujos por request-id y reduce huecos de correlacion detectados en baseline KAN-47. |
