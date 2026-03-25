# PRD - Dominio 1: Auth Access (SIRES)

> TL;DR: Este PRD define el alcance, decisiones preliminares y plan por olas para el Dominio 1 (auth/access) de SIRES: autenticacion, identidad, autorizacion, recuperacion de acceso y trazabilidad.

## 1) Proposito

Definir un marco funcional y operativo, listo para ejecucion, para gobernar el acceso a SIRES con controles de seguridad, auditoria y cumplimiento normativo.

## 2) Alcance

**Incluye (estricto Dominio 1):**
- Gobierno de acceso: autenticacion, identidad, autorizacion, recuperacion de acceso y trazabilidad.
- Ciclo de vida de acceso: alta, cambio, baja, desbloqueo y reasignacion de roles/permisos.
- Controles de privilegios sensibles y mecanismo de break-glass con auditoria reforzada.

**No incluye (fuera de alcance):**
- Rediseno funcional de dominios clinicos no-auth.
- Cambios de producto para paciente, salvo portal activo y critico.
- Proyectos de IAM corporativo fuera del perimetro SIRES.

## 3) Ownership y aprobadores

- Owner de negocio propuesto: Gerencia de Salud (**Pendiente de validacion formal**).
- Ejecucion tecnica: Informatica (**Definido**).
- Aprobadores operativos por tipo de solicitud (**Definido**):
  - Alta: jefe inmediato + owner funcional del perfil.
  - Cambio: jefe inmediato + owner de area/dominio.
  - Baja: evento RRHH/equivalente + ejecucion inmediata por Informatica.
  - Privilegios sensibles: doble aprobacion.

## 4) Contexto y drivers de negocio

- Reducir riesgo operativo y de seguridad por accesos desalineados.
- Estandarizar decisiones de acceso entre sedes/regiones y perfiles.
- Asegurar trazabilidad auditable para operaciones sensibles.
- Habilitar ejecucion incremental por olas sin scope creep.

## 5) Marco normativo y compliance

- NOM-004-SSA3-2012 (**Definido como referencia obligatoria**).
- NOM-024-SSA3-2012 cuando aplique (**Definido con aplicabilidad condicionada**).
- LFPDPPP y Reglamento (**Definido como marco transversal**).
- Retencion de bitacoras base >=5 anos (**Definido**), sujeto a juridica/compliance para plazo final (**Pendiente de validacion**).

## 6) Modelo actual (as-is)

- Estado actual: controles de acceso heterogeneos y con riesgo de variacion por modulo.
- Trazabilidad: existe evidencia parcial, no necesariamente uniforme para todos los eventos sensibles.
- Autorizacion contextual: no consolidada en un modelo unico rol + contexto.
- Recuperacion de acceso: requiere estandarizacion de validaciones y auditoria end-to-end.

## 7) Modelo objetivo (to-be)

- Modelo de permisos hibrido: rol + clinica + sede/region + responsabilidad (**Definido**).
- Resolucion de conflictos: deny-overrides + deny by default (**Definido**).
- Autenticacion objetivo: SSO con directorio corporativo si existe; MFA obligatoria para privilegiados y remoto (**Definido**).
- Gobierno de ciclo de vida de acceso con aprobaciones estandar y SLA de revocacion estricto.

## 8) Arquitectura funcional del dominio

- Capa de identidad: autenticacion, federacion/SSO, politicas de MFA.
- Capa de autorizacion: motor de politicas contextuales y permisos atomicos.
- Capa de administracion de acceso: alta/cambio/baja/desbloqueo, reasignaciones y excepciones.
- Capa de auditoria: captura de eventos minimos obligatorios, almacenamiento append-only y consulta restringida.
- Integracion entre dominios: solo por contratos formales, orquestador de casos de uso o eventos de dominio; prohibido acoplamiento interno cross-domain.

## 9) Flujos clave (end-to-end)

1. **Alta de usuario**: solicitud -> doble validacion segun perfil -> provisionamiento -> evidencia de auditoria.
2. **Cambio de acceso**: solicitud -> aprobacion jefe + owner de area/dominio -> aplicacion controlada -> auditoria.
3. **Baja/revocacion**: disparador RRHH/equivalente -> revocacion inmediata -> bloqueo de sesiones -> auditoria y evidencia.
4. **Recuperacion de acceso**: ticket + validacion de identidad (jefatura/canal corporativo/2do factor si existe) + auditoria.
5. **Break-glass**: justificacion obligatoria + autorizacion definida + temporalidad corta + auditoria reforzada + cierre de excepcion.

## 10) Requerimientos funcionales (RF)

- RF-01: Gestionar autenticacion con opcion SSO corporativo cuando exista.
- RF-02: Exigir MFA para usuarios privilegiados y accesos remotos.
- RF-03: Administrar alta/cambio/baja/desbloqueo con flujo de aprobaciones definido.
- RF-04: Soportar reasignacion de roles/permisos bajo control de owner funcional.
- RF-05: Aplicar autorizacion contextual por rol + clinica + sede/region + responsabilidad.
- RF-06: Resolver conflictos con deny-overrides y deny by default.
- RF-07: Permitir break-glass con controles estrictos y expiracion corta.
- RF-08: Auditar eventos minimos obligatorios del dominio.

## 11) Requerimientos no funcionales (NFR)

- NFR-01 Seguridad: backend como source of truth de autorizacion; frontend solo UX gating.
- NFR-02 Trazabilidad: bitacora append-only, acceso restringido y masking/redaction cuando aplique.
- NFR-03 SLA revocacion: inmediata al dejar de laborar; tolerancia maxima <4h estandar y <1h privilegiadas.
- NFR-04 Disponibilidad operativa: proceso de recuperacion de acceso auditable y replicable.
- NFR-05 Integridad de datos: ownership logico por dominio sobre PostgreSQL compartido en etapa actual.

## 12) Reglas de negocio (definidas)

- RB-01: Ningun acceso se concede por default (deny by default).
- RB-02: Ante conflicto de permisos, prevalece denegacion (deny-overrides).
- RB-03: Operaciones sensibles requieren trazabilidad obligatoria y verificable.
- RB-04: Privilegios sensibles requieren doble aprobacion.
- RB-05: Revocacion por baja laboral es inmediata por Informatica con evidencia auditable.
- RB-06: Break-glass solo procede con justificacion, autorizacion y temporalidad corta.

## 13) Operaciones sensibles y eventos auditables minimos

**Operaciones sensibles minimas (Definido):**
- Alta/cambio/baja/desbloqueo de usuarios.
- Reasignacion de roles/permisos.
- Acceso a expediente fuera de ambito.
- Exportacion masiva.
- Cambios en catalogos criticos.
- Break-glass.
- Acciones administrativas con impacto clinico/operativo.

**Eventos auditables minimos (Definido):**
- Login exitoso/fallido, bloqueos.
- Recuperacion/restablecimiento.
- Altas/cambios/bajas.
- Cambios de rol/permiso.
- Excepciones y break-glass.
- Accesos a informacion sensible.
- Exportaciones y acciones administrativas criticas.

## 14) Contratos funcionales y de datos

- Contrato de decision de acceso (conceptual): `subject`, `roleSet`, `context(clinica,sede,region,responsabilidad)`, `resource`, `action`, `decision`, `reason`.
- Contrato de auditoria minimo: `actor`, `timestamp`, `action`, `domain`, `resource`, `result`, `contextId/requestId`, `ip`, `userAgent`, `beforeState`, `afterState`.
- Contrato de recuperacion de acceso: `ticketId`, `canalValidacion`, `validador`, `resultado`, `evidencia`.
- Politica de integracion cross-domain: consumo por API/contrato/evento; sin acceso directo a tablas internas de otro dominio.

## 15) Plan por olas (implementacion accionable)

**Ola 0 - Gobierno y baseline (corto plazo)**
- Validar owner de negocio formal y matriz de aprobaciones final.
- Definir catalogo inicial de permisos atomicos y perfiles sensibles.
- Acordar retencion legal final de bitacoras con juridica/compliance.

**Ola 1 - Controles core de acceso**
- Estandarizar alta/cambio/baja/desbloqueo con SLA de revocacion.
- Activar modelo de autorizacion contextual (hibrido).
- Endurecer auditoria de operaciones sensibles minimas.

**Ola 2 - Autenticacion objetivo y excepciones**
- Integrar SSO (si directorio corporativo disponible).
- Forzar MFA para privilegiados y remoto.
- Implementar flujo formal de break-glass con cierre y post-analisis.

**Ola 3 - Endurecimiento operativo**
- Medicion continua de SLA de revocacion y recuperacion.
- Tableros de trazabilidad para auditoria interna/compliance.
- Ajustes por hallazgos de control y evidencia operativa.

## 16) Riesgos, supuestos y mitigaciones

- Riesgo: aprobaciones ambiguas por area. Mitigacion: matriz formal por dominio y suplencias.
- Riesgo: friccion operativa por MFA. Mitigacion: rollout por perfiles de riesgo y soporte de onboarding.
- Riesgo: break-glass abusivo. Mitigacion: causal obligatoria, expiracion corta y revision periodica.
- Riesgo: discrepancias legales en retencion. Mitigacion: cierre formal con juridica/compliance antes de Ola 1.
- Supuesto: existe capacidad operativa de Informatica para ejecucion inmediata de bajas.

## 17) Criterios de aceptacion del dominio

- CA-01: 100% de altas/cambios/bajas ejecutadas con ruta de aprobacion definida.
- CA-02: Revocaciones por baja laboral con cumplimiento de SLA comprometido.
- CA-03: 100% de operaciones sensibles minimas con evento auditable completo.
- CA-04: Politicas deny-by-default y deny-overrides activas y verificadas.
- CA-05: Recuperacion de acceso siempre respaldada por ticket + validacion identidad + auditoria.
- CA-06: Break-glass solo con evidencia de justificacion, autorizacion, expiracion y cierre.

## 18) DoR de ejecucion y checklist cliente

**DoR minimo para iniciar implementacion por ola:**
- Alcance congelado en Dominio 1 (sin dependencias de funcionalidad clinica fuera de auth/access).
- Owners primario/secundario definidos (negocio y tecnico).
- Matriz preliminar de permisos/contexto versionada.
- Reglas de aprobacion confirmadas por area.
- Criterios de evidencia y auditoria acordados.

**Checklist de validacion cliente/compliance:**
- [ ] Confirmar formalmente owner de negocio (Gerencia de Salud).
- [ ] Confirmar aplicabilidad final de NOM-024-SSA3-2012 por tipo de flujo.
- [ ] Confirmar retencion final de bitacoras (>=5 anos base).
- [ ] Confirmar causalario y autorizadores para break-glass.
- [ ] Confirmar listado final de perfiles privilegiados.

## 19) Matriz de decisiones (Definido vs Pendiente validacion)

| Tema | Estado | Decision preliminar |
|---|---|---|
| Alcance Dominio 1 | Definido | Solo autenticacion, identidad, autorizacion, recuperacion y trazabilidad |
| Owner de negocio | Pendiente validacion cliente/compliance | Gerencia de Salud (propuesto) |
| Ejecucion tecnica | Definido | Informatica |
| Aprobaciones alta/cambio/baja/sensibles | Definido | Segun matriz indicada en este PRD |
| SLA revocacion | Definido | Inmediata; max <4h estandar y <1h privilegiadas |
| SSO | Definido condicionado | Se implementa si existe directorio corporativo |
| MFA | Definido | Obligatoria para privilegiados y remoto |
| Modelo permisos | Definido | Hibrido: rol + clinica + sede/region + responsabilidad |
| Conflictos de permisos | Definido | deny-overrides + deny by default |
| Retencion de bitacoras | Pendiente validacion cliente/compliance | Base >=5 anos |
| Paciente fase 1 | Definido | Fuera de alcance salvo portal activo y critico |
| Break-glass | Definido con validacion operativa pendiente | Permitido con controles estrictos |

## 20) Evidencias requeridas y salida a PRD ejecutable

**Evidencias minimas por ola:**
- Flujos aprobados por negocio y compliance.
- Matriz de permisos y aprobaciones firmada.
- Registro de pruebas funcionales de autorizacion contextual.
- Evidencia de bitacoras para eventos auditables minimos.
- Reporte de cumplimiento de SLA de revocacion.

**Salida a PRD ejecutable (Definido):**
- Este documento queda como base de planificacion para Jira + SDD.
- Cada ola debe desglosarse en historias/tareas con criterios de aceptacion trazables a secciones RF/NFR/RB/CA.
- Cualquier cambio de alcance fuera de Dominio 1 requiere RFC corto y aprobacion explicita antes de ejecucion.

## Referencias

- `docs/domains/auth-access/overview.md`
- `docs/domains/auth-access/pending-decisions.md`
- `docs/domains/auth-access/backlog-mapping.md`
- `docs/architecture/domain-map.md`
- `docs/architecture/context-map.md`
- `docs/architecture/dependency-rules.md`
- `docs/architecture/db-ownership-migration-policy.md`
- `docs/guides/domain-dor-dod.md`
- `docs/guides/pr-merge-governance.md`
