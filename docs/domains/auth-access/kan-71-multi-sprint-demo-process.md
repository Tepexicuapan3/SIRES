# KAN-71 - Guía institucional de demo multi-sprint (Auth-Access)

> TL;DR: Se institucionaliza un proceso único, repetible y trazable para demos por sprint en Auth-Access (Sprint 2+), con plantilla estándar de acta, checklist de evidencia mínima y flujo operativo de cierre Jira + PR + docs.

## 1) Objetivo y alcance

### Objetivo

Definir una guía reusable para cierre de sprint orientado a demo que:

- estandarice la estructura de acta por sprint,
- fuerce evidencia mínima verificable,
- y deje un flujo operativo claro de cierre compatible con el proceso actual del equipo.

### Alcance IN

- Plantilla reusable `Demo Sprint X`.
- Checklist mínimo obligatorio por sprint (PRs/tests/riesgos/rollback/decisiones).
- Protocolo de cierre operativo (Jira + PR + evidencia + aprobación).
- Aplicación de checklist a un caso real (Sprint 1).

### Alcance OUT

- Sin cambios de código de aplicación.
- Sin cambios de contratos API.
- Sin reapertura de tickets técnicos cerrados.

## 2) Entradas mínimas (DoR de demo)

Antes de preparar el cierre de demo de un sprint, deben existir:

- ticket Jira del cierre del sprint (`KAN-XX`) con AC explícitos;
- PR(s) técnicas cerradas o en estado verificable;
- evidencia de pruebas según riesgo (unit/integration/E2E si aplica);
- actas/documentos canónicos del dominio actualizados;
- owner primario y owner secundario definidos.

Si falta alguna entrada, el estado de cierre no puede ser `aceptado`.

## 3) Plantilla reusable: `Demo Sprint X`

Copiar/pegar esta estructura para cada sprint nuevo.

```md
# Demo Sprint <N> - Auth-Access

> TL;DR: <estado + resultado en 1 línea>

## 1) Resumen ejecutivo
- Scope:
- Fuentes auditadas:
- Resultado:
- Estado final: `aceptado|parcial|bloqueado`

## 2) Matriz AC -> Evidencia
| ac_id | ticket_fuente | jira_url | pr_url | test_evidence | doc_ref | resultado | severidad | observaciones |
|---|---|---|---|---|---|---|---|---|

## 3) Checklist operativo (PASS/FAIL)
- [ ] ACs con resultado explícito
- [ ] Evidencia técnica mínima por AC
- [ ] Trazabilidad Jira <-> PR <-> docs
- [ ] Riesgos/gaps con owner + ETA
- [ ] Estado final justificado por reglas de clasificación

## 4) Reglas de clasificación
`aceptado`: todo validado, sin blockers críticos.
`parcial`: hay gaps no críticos con owner + ETA.
`bloqueado`: blocker crítico o gap sin owner/ETA.

## 5) Gaps y riesgos
| gap_id | impacto | owner | eta | estado | evidencia_compensatoria |
|---|---|---|---|---|---|

## 6) Dictamen de cierre
- Estado final:
- Justificación:
- Condiciones para pasar de parcial/bloqueado a aceptado:

## 7) Paquete para PR/Jira
- Resumen para PR:
- Comentario Jira:
- Próximos pasos:
```

## 4) Checklist mínimo obligatorio por sprint (evidencia)

## 4.1 Evidencia técnica

- [ ] Lista de PRs del sprint con estado verificable.
- [ ] Evidencia de pruebas relevante por ticket crítico.
- [ ] Evidencia de rollback/mitigación para cambios de riesgo.
- [ ] Riesgos residuales clasificados (bajo/media/alta/crítica).

## 4.2 Evidencia documental

- [ ] Acta canónica del sprint creada/actualizada en `docs/domains/auth-access/`.
- [ ] Índices actualizados (`docs/README.md` + `docs/domains/auth-access/README.md`).
- [ ] `changelog.md` y `decision-log.md` actualizados con cierre.
- [ ] Gaps canónicos/fallback documentados si aplica.

## 4.3 Evidencia operativa Jira

- [ ] Estado del ticket de cierre alineado con dictamen (`In Review` o `Done`).
- [ ] Comentario Jira con link de PR + resumen + próximos pasos.
- [ ] Si hay bloqueo: owner + ETA + plan de desbloqueo.

## 5) Flujo de cierre operativo (paso a paso)

1. **Recolectar evidencia del sprint**
   - consolidar PRs, tests, docs y riesgos en una sola acta.
2. **Evaluar AC por AC**
   - marcar `validado/gap/invalidado` con evidencia explícita.
3. **Aplicar reglas de clasificación**
   - emitir estado `aceptado|parcial|bloqueado` con justificación técnica.
4. **Actualizar documentación canónica**
   - acta + changelog + decision-log + discoverability.
5. **Abrir PR del cierre**
   - incluir trazabilidad y checklist aplicado.
6. **Actualizar Jira**
   - mover estado según gate y comentar link de PR + próximos pasos.
7. **Validación del owner secundario**
   - quick review final y cierre formal.

## 6) Caso real aplicado (Sprint 1)

Esta guía se valida con el caso real de Sprint 1:

- Acta de referencia: `docs/domains/auth-access/kan-70-s1-document-closure-acta.md`
- Cierre QA pre-deploy: `docs/domains/auth-access/kan-60-s1-qa-regression-go-no-go.md`

### Resultado de aplicación

- [x] Estructura de acta unificada usada y trazable.
- [x] Evidencia mínima por AC documentada.
- [x] Reglas de clasificación explícitas y reproducibles.
- [x] Flujo Jira + PR + docs ejecutable sin ambigüedad.

## 7) Criterios de aceptación KAN-71 (mapeo)

| AC KAN-71 | Cumplimiento en esta guía |
|---|---|
| Guía/plantilla multi-sprint clara y reutilizable | Secciones 3 y 5 |
| Evidencia mínima obligatoria por sprint | Sección 4 |
| Flujo de cierre compatible con proceso actual | Sección 5 + alineación con `jira-workflow-operating-model.md` |
| Trazabilidad Jira + PR y validación owner secundario | Sección 5 (pasos 6/7) + paquete de PR/Jira |

## 8) Referencias

- `docs/domains/auth-access/jira-workflow-operating-model.md`
- `docs/guides/pr-merge-governance.md`
- `docs/guides/domain-dor-dod.md`
- `docs/domains/auth-access/kan-70-s1-document-closure-acta.md`
- `docs/domains/auth-access/kan-60-s1-qa-regression-go-no-go.md`
- Notion Sprint Plan: `https://www.notion.so/32f123c602008190b9d8efd24b9e4639`
- Notion Sprint 1 cliente: `https://www.notion.so/330123c60200815686c7d647a6c80fa8`
