# Auth-Access - Cierre formal MVP y Fase 2 (validado con cliente)

> TL;DR: Se cierra formalmente el alcance de Auth-Access para ejecucion. El MVP queda enfocado en usuarios operativos internos con controles estrictos de seguridad, trazabilidad completa y excepciones gobernadas. Pacientes pasan a Fase 2.

## 1) Resumen ejecutivo

- **Estado**: cierre documental formal completado con decisiones validadas por cliente.
- **MVP (ahora)**: usuarios operativos internos.
- **Fase 2 (posterior)**: pacientes.
- **Principios innegociables**: minimo privilegio + `deny by default`.
- **Criticidad**: alta; una caida de 1 hora impacta transversalmente la operacion.

## 2) Alcance final (MVP vs Fase 2)

| Componente | MVP (cerrado) | Fase 2 |
| --- | --- | --- |
| Login | ✅ Si | ✅ Si |
| Alta/cambio/inhabilitacion/baja | ✅ Si | ✅ Si |
| Recuperacion de acceso | ✅ Si | ✅ Si |
| Roles y permisos | ✅ Si | ✅ Si |
| Restriccion por perfil/capacidades | ✅ Si | ✅ Si |
| Bitacora y trazabilidad | ✅ Si | ✅ Si |
| Pacientes | ❌ No | ✅ Si |

## 3) Gobierno operativo y ownership

| Rol de gobierno | Responsable |
| --- | --- |
| Titular del dominio | **David Tepexicuapan** |
| Suplente del dominio | **Luis Antonio** |
| Coordinacion obligatoria | Administracion + Compliance |

## 4) Reglas operativas de aprobacion y excepciones

### 4.1 Principios de control

1. Toda asignacion de acceso parte de **denegado por defecto**.
2. Se concede solo lo estrictamente necesario (**minimo privilegio**).
3. Seguridad y operacion deben balancearse; si no hay equilibrio, **prevalece seguridad** con mecanismo excepcional trazable.

### 4.2 Baja fuera de horario

- Ejecucion: informatica / responsable tecnico.
- SLA comprometido:
  - cuentas privilegiadas: **< 1 hora**
  - cuentas normales: **< 4 horas**

## 5) Catalogo de acciones sensibles (doble validacion obligatoria)

Las siguientes acciones requieren **doble validacion** (solicitante y aprobadores independientes):

1. Alta, cambio, inhabilitacion y baja de cuentas con impacto en seguridad.
2. Cambios de roles/permisos de alto impacto.
3. Operaciones de excepcion (break-glass).
4. Exportacion de datos sensibles.

> Regla adicional: exportacion de datos sensibles requiere autorizacion de administracion y una validacion adicional segun impacto.

## 6) Break-glass operativo (flujo, SLA, evidencia)

### 6.1 Segregacion obligatoria

El flujo de excepcion separa funciones en tres actores distintos:

- **Pedir** (solicita la excepcion)
- **Autorizar** (aprueba la excepcion)
- **Ejecutar** (aplica la excepcion)

### 6.2 Reglas temporales

- Duracion maxima por excepcion: **2 horas**.
- Si continua la necesidad, requiere **renovacion formal**.

### 6.3 Evidencia minima por evento break-glass

- motivo de excepcion,
- solicitante,
- autorizador,
- ejecutor,
- timestamp de inicio/fin,
- alcance de acceso otorgado,
- evidencia de cierre o renovacion.

## 7) Matriz de perfiles privilegiados por capacidad (no por puesto)

> Regla: "privilegiado" se define por **capacidad efectiva** y no por nombre de puesto.

| Capacidad | Clasificacion |
| --- | --- |
| Crear/modificar/eliminar usuarios | Privilegiado |
| Asignar/revocar roles/permisos | Privilegiado |
| Ejecutar break-glass | Privilegiado |
| Exportar datos sensibles | Privilegiado |
| Cambiar configuraciones de seguridad | Privilegiado |
| Consultar/operar dentro de permisos acotados sin capacidades administrativas | No privilegiado |

## 8) Politica de trazabilidad y evidencia minima

La trazabilidad exigida para operaciones criticas es:

- **quien** hizo la accion,
- **que** accion realizo,
- **cuando** la realizo,
- **con que permiso** lo hizo,
- **quien autorizo**,
- **sobre que recurso** se aplico.

Para cambios de permisos, la evidencia minima obligatoria es:

1. solicitante,
2. aprobador,
3. ejecutor,
4. fecha-hora,
5. usuario afectado,
6. permiso anterior y permiso nuevo,
7. motivo,
8. alcance.

## 9) KPIs de exito (primeros 90 dias)

1. **% de usuarios con permisos correctos**.
2. **Tiempo promedio del ciclo de acceso** (alta/cambio/baja/recuperacion).
3. **% de eventos criticos con trazabilidad completa**.

## 10) Frecuencia de recertificacion de permisos

| Tipo de acceso | Frecuencia |
| --- | --- |
| Privilegiados y excepcionales | Mensual |
| Normales | Trimestral |

## 11) Riesgos, dependencias y mitigaciones

### 11.1 Riesgos principales

- Administracion tecnica de informatica.
- Administracion funcional.
- Jefaturas transversales con capacidad de solicitar o influir cambios de acceso.

### 11.2 Dependencias externas

- Definicion oportuna de roles y aprobadores.

### 11.3 Mitigacion acordada

- Matriz minima operativa para no bloquear ejecucion.
- Desacople de integraciones no criticas durante el MVP.

## 12) Casos correctos vs incorrectos (ejemplos concretos)

| Escenario | Correcto | Incorrecto |
| --- | --- | --- |
| Cambio de permiso sensible | Solicitud + doble validacion + evidencia minima completa + trazabilidad | Cambio directo por chat/correo sin aprobador formal ni evidencia |
| Baja fuera de horario (cuenta privilegiada) | Revocacion <1h, evidencia de ejecucion y cierre | Baja al siguiente dia "porque no habia guardia" |
| Break-glass | Pedir/autorizar/ejecutar separados, max 2h, cierre o renovacion formal | Misma persona solicita y ejecuta, sin TTL ni cierre |
| Exportacion de datos sensibles | Autorizacion de administracion + validacion adicional por impacto | Exportacion por urgencia sin aprobacion formal |
| Definicion de privilegiado | Clasificacion por capacidades efectivas | Clasificacion por titulo del puesto |

## 13) Glosario rapido

- **Minimo privilegio**: dar solo el acceso estrictamente necesario.
- **Deny by default**: si no hay permiso explicito, se deniega.
- **Doble validacion**: dos aprobaciones independientes para accion sensible.
- **Break-glass**: acceso excepcional y temporal bajo control reforzado.
- **Recertificacion**: revision periodica para confirmar que permisos siguen siendo correctos.

## 14) Definition of Ready (DoR) para pasar a implementacion

Antes de abrir/ejecutar trabajo tecnico del dominio, debe cumplirse:

- [ ] Alcance MVP/Fase 2 congelado y comunicado al equipo.
- [ ] Matriz de capacidades privilegiadas versionada.
- [ ] Flujo de doble validacion documentado por tipo de accion sensible.
- [ ] Flujo break-glass operativo con SLA y evidencias obligatorias.
- [ ] Plantilla de evidencia minima para cambios de permisos disponible.
- [ ] KPIs de 90 dias definidos con owner y fuente de medicion.
- [ ] Frecuencia de recertificacion configurada (mensual/trimestral).
- [ ] Riesgos y mitigaciones registrados con responsables.

## 15) Referencias

- `docs/domains/auth-access/prd.md`
- `docs/domains/auth-access/pending-decisions.md`
- `docs/domains/auth-access/decision-log.md`
- `docs/architecture/dependency-rules.md`
- `docs/guides/domain-dor-dod.md`
