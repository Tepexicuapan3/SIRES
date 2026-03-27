# auth-access - Overview

> Resumen operativo del Dominio 1 para alineacion funcional, tecnica y de compliance.

## Contexto

El dominio `auth-access` establece los controles de acceso de SIRES bajo el baseline de monolito modular evolutivo, con ownership por dominio y gobernanza Jira + SDD + TDD-first.

## Limites (in-scope)

- Autenticacion (incluyendo SSO condicional y MFA por riesgo).
- Identidad y validaciones de recuperacion de acceso.
- Autorizacion por permisos atomicos y contexto.
- Ciclo de vida de acceso (alta, cambio, baja, desbloqueo).
- Auditoria y trazabilidad de operaciones sensibles.
- Gobierno de excepciones (break-glass) con segregacion de funciones.

## Fuera de alcance

- Rediseno funcional de dominios clinicos fuera de auth-access.
- Integraciones IAM corporativas no necesarias para SIRES en esta fase.
- Funcionalidad de pacientes en MVP (se aborda en Fase 2).

## Principios operativos

- Backend como source of truth de autorizacion.
- `deny by default` + `deny-overrides` para conflictos.
- Minimo privilegio y doble validacion para acciones sensibles.
- Integracion cross-domain solo por contratos/orquestacion/eventos.
- Evidencia auditable obligatoria en operaciones sensibles.

## Documentos fuente del dominio

- PRD: [`prd.md`](./prd.md)
- Pendientes de cierre: [`pending-decisions.md`](./pending-decisions.md)
- Mapeo a ejecucion: [`backlog-mapping.md`](./backlog-mapping.md)
- Registro de decisiones: [`decision-log.md`](./decision-log.md)
- Historial de cambios: [`changelog.md`](./changelog.md)
- Cierre formal validado: [`cierre-formal-mvp-fase2.md`](./cierre-formal-mvp-fase2.md)
