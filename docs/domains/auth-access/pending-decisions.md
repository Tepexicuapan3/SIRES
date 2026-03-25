# Dominio 1 Auth Access - Pendientes Criticos para Reunion

> TL;DR: Guia operativa para cerrar en una sola reunion los pendientes bloqueantes del PRD del Dominio 1 (auth/access), con decisiones trazables, responsables y evidencias de cierre.

## Problem / Context

El PRD base de Dominio 1 define el alcance funcional y el plan por olas, pero todavia tiene decisiones de negocio/compliance que bloquean la delimitacion final para Jira + SDD y la ejecucion sin retrabajo.

Pendientes a cerrar en esta reunion:

1. Validacion formal del owner de negocio.
2. Aplicabilidad exacta de NOM-024 por flujo.
3. Retencion final de bitacoras (base >=5 anos, confirmar legal).
4. Causalario y autorizadores finales de break-glass.
5. Lista final de perfiles privilegiados.
6. Confirmacion de disponibilidad de directorio corporativo para SSO.

## Solution / Implementation

## Objetivo de la reunion

Cerrar decisiones bloqueantes con due date y responsable explicito para declarar el PRD de Dominio 1 como "definido y delimitado" en sus puntos pendientes de gobierno, cumplimiento y seguridad.

## Matriz accionable de decisiones bloqueantes

### 1) Validacion formal del owner de negocio

- Contexto e impacto: sin owner formal no hay autoridad de priorizacion ni aprobacion final de alcance/criterios del dominio.
- Pregunta exacta: "Que puesto y nombre (titular + suplente) asume ownership de negocio del Dominio 1 y con que nivel de firma?"
- Opciones y tradeoffs:
  - Opcion A: Gerencia de Salud como owner principal + suplente de Operaciones Clinicas. Pro: alineacion funcional; Contra: posible cuello de botella.
  - Opcion B: Co-ownership Salud + Informatica. Pro: velocidad de decision; Contra: riesgo de ambiguedad de accountability.
- Recomendacion: Opcion A con suplencia formal y SLA de respuesta para evitar bloqueo operativo.
- Criterio de cierre (definido y delimitado): owner principal y suplente nombrados por cargo/persona, alcance de autoridad documentado y vigencia definida.
- Responsables por decision: Negocio (R), Tech (C), Compliance (C).
- Evidencias requeridas: minuta aprobada, correo o acta de designacion, matriz RACI actualizada.
- Riesgo si no se define: decisiones contradictorias, retraso en Jira/SDD, disputas de aprobacion.

### 2) Aplicabilidad exacta de NOM-024 por flujo

- Contexto e impacto: la aplicabilidad condicionada genera riesgo de sobre/infra-control y observaciones de auditoria.
- Pregunta exacta: "Para cada flujo del Dominio 1 (alta, cambio, baja, recuperacion, break-glass), NOM-024 aplica total, parcial o no aplica, y bajo que criterio?"
- Opciones y tradeoffs:
  - Opcion A: interpretacion conservadora (aplica por defecto salvo excepcion justificada). Pro: menor riesgo regulatorio; Contra: mayor costo operativo.
  - Opcion B: matriz de aplicabilidad por flujo y evidencia requerida. Pro: precision y trazabilidad; Contra: requiere trabajo inicial de compliance.
- Recomendacion: Opcion B con criterio conservador temporal hasta aprobacion final.
- Criterio de cierre (definido y delimitado): matriz flujo x clausula NOM-024 con estado de aplicabilidad y responsable de cumplimiento.
- Responsables por decision: Compliance (R), Negocio (C), Tech (C).
- Evidencias requeridas: matriz firmada por compliance/legal, referencia normativa por flujo, version controlada en docs.
- Riesgo si no se define: incumplimiento normativo, retrabajo de controles, hallazgos en auditoria interna/externa.

### 3) Retencion final de bitacoras (base >=5 anos)

- Contexto e impacto: el PRD deja base >=5 anos, pero sin plazo final legal no se puede cerrar politica de almacenamiento/costo/riesgo.
- Pregunta exacta: "Cual es el plazo legal final de retencion de bitacoras de auth/access y su regla de inicio de computo?"
- Opciones y tradeoffs:
  - Opcion A: fijar 5 anos como valor final. Pro: simple y alineado con base actual; Contra: puede quedar corto segun criterio legal.
  - Opcion B: fijar plazo legal explicitado por juridica (>=5) + politica de archivo por tramos. Pro: robustez legal; Contra: mayor costo de storage y gestion.
- Recomendacion: Opcion B con retencion activa + archivo historico y revisiones anuales.
- Criterio de cierre (definido y delimitado): plazo final aprobado por legal/compliance, regla de inicio, regla de disposicion segura y excepciones.
- Responsables por decision: Compliance/Legal (R), Tech (C), Negocio (I).
- Evidencias requeridas: dictamen legal, politica de retencion publicada, criterios de borrado/anonimizacion aprobados.
- Riesgo si no se define: exposicion legal, costos no controlados, imposibilidad de defender trazabilidad historica.

### 4) Causalario y autorizadores finales de break-glass

- Contexto e impacto: sin causalario cerrado, break-glass puede usarse de forma discrecional y aumentar riesgo de abuso.
- Pregunta exacta: "Que causales habilitan break-glass, quien autoriza cada causal y cual es la vigencia maxima por evento?"
- Opciones y tradeoffs:
  - Opcion A: lista corta de causales criticas + doble autorizacion siempre. Pro: fuerte control; Contra: menor agilidad en incidentes.
  - Opcion B: lista por severidad con rutas de autorizacion diferenciadas. Pro: balance control/agilidad; Contra: mayor complejidad operativa.
- Recomendacion: Opcion B con categoria critica obligando doble autorizacion y post-analisis en 24h.
- Criterio de cierre (definido y delimitado): catalogo de causales versionado, autorizadores titulares/suplentes por causal y TTL maxima definida.
- Responsables por decision: Negocio (R), Compliance (C), Tech/SecOps (C).
- Evidencias requeridas: causalario aprobado, workflow firmado, formato de post-mortem de excepcion.
- Riesgo si no se define: abuso de privilegios, observaciones de auditoria, incidentes sin trazabilidad suficiente.

### 5) Lista final de perfiles privilegiados

- Contexto e impacto: MFA, monitoreo reforzado y controles de aprobacion dependen de esta lista.
- Pregunta exacta: "Que perfiles/puestos de SIRES se clasifican como privilegiados y por que criterio objetivo?"
- Opciones y tradeoffs:
  - Opcion A: clasificacion por rol tecnico (admin, soporte, DBA, etc.). Pro: implementacion rapida; Contra: puede ignorar privilegios funcionales reales.
  - Opcion B: clasificacion por capacidad efectiva (impacto en datos/servicio), independiente del nombre del rol. Pro: control real del riesgo; Contra: requiere analisis detallado.
- Recomendacion: Opcion B con mapeo inicial a roles existentes para despliegue rapido.
- Criterio de cierre (definido y delimitado): lista versionada de perfiles privilegiados con criterio de inclusion/exclusion y owner de mantenimiento.
- Responsables por decision: Tech/Security (R), Negocio (C), Compliance (C).
- Evidencias requeridas: matriz de perfiles firmada, criterio de riesgo documentado, plan de revision periodica.
- Riesgo si no se define: brechas de MFA/control, privilegios sin vigilancia, fallas en segregacion de funciones.

### 6) Confirmacion de disponibilidad de directorio corporativo para SSO

- Contexto e impacto: condiciona arquitectura de autenticacion, esfuerzo de integracion y plan de olas.
- Pregunta exacta: "Existe directorio corporativo disponible para SIRES (tecnico y contractual), con fecha objetivo y responsable de provision?"
- Opciones y tradeoffs:
  - Opcion A: SSO disponible en plazo (integrar en Ola 2). Pro: mejor UX y control centralizado; Contra: dependencia externa.
  - Opcion B: SSO no disponible en plazo (fallback local endurecido + roadmap de integracion). Pro: no bloquea avance; Contra: deuda temporal de identidad federada.
- Recomendacion: definir decision binaria con fecha limite de corte (go/no-go) para no frenar ola de autenticacion.
- Criterio de cierre (definido y delimitado): estado oficial de disponibilidad, responsable de integracion y plan aprobado para escenario seleccionado.
- Responsables por decision: Tech/Infra IAM (R), Negocio (C), Compliance (I).
- Evidencias requeridas: confirmacion de IAM corporativo, prerequisitos tecnicos validados, cronograma de integracion o plan fallback firmado.
- Riesgo si no se define: incertidumbre de arquitectura, retrabajo de autenticacion, desalineacion del plan por olas.

## Agenda sugerida de reunion (timeboxed 90 min)

- 0-10 min: contexto, objetivo y reglas de cierre (solo decisiones trazables).
- 10-25 min: owner de negocio + RACI final.
- 25-40 min: NOM-024 por flujo.
- 40-55 min: retencion de bitacoras.
- 55-70 min: break-glass (causalario + autorizadores + TTL).
- 70-80 min: perfiles privilegiados.
- 80-88 min: estado SSO (go/no-go + fecha de corte).
- 88-90 min: recap de acuerdos, due dates y bloqueos remanentes.

## Acta de decisiones (plantilla para completar en vivo)

```markdown
# Acta - Cierre pendientes PRD Dominio 1 Auth Access

- Fecha:
- Moderador:
- Participantes (Negocio/Tech/Compliance):

## Decisiones cerradas

| Pendiente | Decision final | Responsable | Fecha compromiso | Evidencia comprometida |
|---|---|---|---|---|
| Owner de negocio |  |  |  |  |
| NOM-024 por flujo |  |  |  |  |
| Retencion de bitacoras |  |  |  |  |
| Break-glass (causalario/autorizadores) |  |  |  |  |
| Perfiles privilegiados |  |  |  |  |
| SSO corporativo |  |  |  |  |

## Bloqueos abiertos (si aplica)

| Bloqueo | Dueno | Mitigacion | Fecha limite |
|---|---|---|---|
|  |  |  |  |

## Confirmacion de cierre

- [ ] Todos los pendientes quedaron "definidos y delimitados" con evidencia.
- [ ] Se actualizara PRD base y matriz de decisiones dentro de 24h.
- [ ] Se habilita descomposicion Jira + SDD sin supuestos abiertos criticos.
```

## Proximos pasos post-reunion

1. Actualizar `docs/domains/auth-access/prd.md` con decisiones finales y estado de pendientes.
2. Publicar acta y evidencias en carpeta de governance/documentacion del dominio.
3. Traducir decisiones a epicas/historias/tareas Jira con criterios de aceptacion trazables.
4. Ajustar plan por olas (si cambia SSO o compliance) antes de iniciar ejecucion tecnica.
5. Ejecutar checkpoint de riesgo/compliance a los 15 dias para validar adopcion operativa.

## References

- `docs/domains/auth-access/prd.md`
- `docs/guides/domain-dor-dod.md`
- `docs/guides/pr-merge-governance.md`
- `docs/architecture/domain-map.md`
- `docs/architecture/context-map.md`
- `docs/architecture/dependency-rules.md`
- `docs/architecture/db-ownership-migration-policy.md`
