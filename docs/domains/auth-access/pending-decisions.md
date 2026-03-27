# Auth-Access - Cierre formal de decisiones historicamente pendientes

> TL;DR: Los pendientes criticos del dominio quedaron cerrados con validacion de cliente. Este documento deja acta de resolucion y elimina bloqueos para implementacion.

## 1) Estado global

- Pendientes criticos abiertos: **0**.
- Estado de cierre: **resuelto**.
- Uso del documento: historial de decisiones que antes estaban abiertas.

## 2) Matriz de cierre

| ID | Decision (antes pendiente) | Estado final | Resolucion validada |
| --- | --- | --- | --- |
| PD-01 | Owner de negocio titular/suplente | Resuelto | Titular: **David Tepexicuapan**. Suplente: **Luis Antonio**. Coordinacion con administracion/compliance. |
| PD-02 | Delimitacion de alcance MVP | Resuelto | MVP interno para usuarios operativos; pacientes pasan a Fase 2. |
| PD-03 | Principio de autorizacion | Resuelto | Minimo privilegio + `deny by default`. |
| PD-04 | Cobertura de ciclo de acceso en MVP | Resuelto | Login, alta/cambio/inhabilitacion/baja, recuperacion, roles/permisos, restriccion por perfil, bitacora y trazabilidad. |
| PD-05 | Criticidad operativa | Resuelto | Alta: 1h de caida impacta transversalmente. |
| PD-06 | Bajas fuera de horario | Resuelto | Informatica/responsable tecnico. SLA: <1h privilegiados, <4h normales. |
| PD-07 | Doble validacion de acciones sensibles | Resuelto | Obligatoria para acciones sensibles definidas por cliente. |
| PD-08 | Break-glass | Resuelto | Segregacion pedir/autorizar/ejecutar; maximo 2h; renovacion formal obligatoria. |
| PD-09 | Evidencia minima en cambios de permisos | Resuelto | Solicitante, aprobador, ejecutor, fecha-hora, usuario afectado, permiso anterior/nuevo, motivo y alcance. |
| PD-10 | Trazabilidad completa | Resuelto | Quien hizo que, cuando, con que permiso, quien autorizo y sobre que recurso. |
| PD-11 | Definicion de perfil privilegiado | Resuelto | Se define por capacidades, no por nombre de puesto. |
| PD-12 | Exportacion de datos sensibles | Resuelto | Requiere autorizacion de administracion + validacion adicional segun impacto. |
| PD-13 | KPIs de 90 dias | Resuelto | % permisos correctos, tiempo promedio de ciclo de acceso, % eventos criticos trazables. |
| PD-14 | Recertificacion de permisos | Resuelto | Mensual privilegiados/excepcionales; trimestral normales. |
| PD-15 | Dependencias externas | Resuelto | Dependencia en definicion de roles/aprobadores; mitigacion con matriz minima y desacople de integraciones no criticas. |
| PD-16 | Criterio de desempate operacion vs seguridad | Resuelto | Preservar operacion sin perder control; si no hay equilibrio, prevalece seguridad con mecanismo excepcional. |

## 3) Riesgos residuales vigentes

1. Administracion tecnica de informatica.
2. Administracion funcional.
3. Jefaturas transversales.

Mitigacion activa:

- recertificacion periodica,
- doble validacion en acciones sensibles,
- evidencia minima obligatoria,
- monitoreo de KPIs de 90 dias.

## 4) Evidencia de cierre documental

Este cierre se materializa en:

- `docs/domains/auth-access/cierre-formal-mvp-fase2.md`
- `docs/domains/auth-access/prd.md` (alineado al estado final)
- `docs/domains/auth-access/decision-log.md`

## 5) Referencias

- `docs/domains/auth-access/README.md`
- `docs/domains/auth-access/cierre-formal-mvp-fase2.md`
- `docs/domains/auth-access/prd.md`
- `docs/guides/domain-dor-dod.md`
