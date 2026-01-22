# Templates de Documentación

Este directorio contiene templates para crear documentación consistente en el proyecto SIRES.

---

## Templates Disponibles

### 1. `guide-template.md` - Guías de Implementación

**Cuándo usar:**
- Crear guías paso a paso para implementar features
- Documentar patrones repetibles
- Explicar cómo hacer algo específico en el proyecto

**Destino:** `docs/guides/<nombre-guia>.md`

**Ejemplo de uso:**
- Copiar `docs/templates/guide-template.md` a `docs/guides/mi-guia.md`.
- Completar los placeholders con el contenido real.
- Linkear desde `docs/README.md`.

**Estructura:**
- TL;DR (resumen ejecutivo)
- Contexto y problema
- Prerequisitos
- Paso a paso (con código copy/paste)
- Checklist final
- Troubleshooting
- Ejemplos completos
- Referencias

**Reglas:**
- Máximo 500 líneas
- Solo información esencial
- Ejemplos funcionales (copy/paste ready)
- NO duplicar contenido existente

---

### 2. `adr-template.md` - Architecture Decision Records

**Cuándo usar:**
- Documentar decisiones arquitectónicas importantes
- Justificar por qué elegimos una solución sobre otras
- Registrar trade-offs aceptados

**Destino:** `docs/adr/###-titulo-decision.md`

**Ejemplo de uso:**
- Copiar `docs/templates/adr-template.md` a `docs/adr/###-mi-decision.md`.
- Numerar secuencialmente y completar la metadata.
- Linkear desde `docs/README.md`.

**Estructura:**
- Contexto y problema
- Decisión tomada
- Alternativas consideradas (con pros/contras)
- Consecuencias (positivas y negativas)
- Implementación (código + archivos afectados)
- Validación y métricas
- Referencias

**Reglas:**
- Numerar secuencialmente (001, 002, 003...)
- Formato: `###-titulo-corto.md`
- Incluir estado (Propuesto | Aceptado | Deprecado)
- Documentar TODAS las alternativas (no solo la elegida)
- Ser honesto con los trade-offs

---

## Cómo Usar los Templates

### Uso Manual (Recomendado)

1. **Copiar template:**
   ```bash
   # Para guía
   cp docs/templates/guide-template.md docs/guides/mi-guia.md
   
   # Para ADR (encontrar próximo número)
   cp docs/templates/adr-template.md docs/adr/003-mi-decision.md
   ```

2. **Reemplazar placeholders:**
   - `[Texto entre corchetes]` → Tu contenido
   - `YYYY-MM-DD` → Fecha actual
   - `@usuario` → Tu username
   - `###` → Número secuencial (ADRs)

3. **Rellenar secciones:**
   - Borrá secciones que no apliquen
   - Mantené la estructura principal
   - Agregá ejemplos funcionales

4. **Validar:**
   - [ ] Menos de 500 líneas
   - [ ] Ejemplos copy/paste funcionales
   - [ ] Sin duplicación de contenido
   - [ ] Linkeado desde `docs/README.md`

5. **Linkear:**
   ```markdown
   # En docs/README.md, agregar:
   - [Título de tu doc](./guides/mi-guia.md)
   ```

---

## Checklist Pre-Creación

**Antes de crear un nuevo documento, preguntate:**

1. **¿Ya existe?**
   ```bash
    # Buscar en docs/
    rg "palabra clave" docs/
   ```

2. **¿Es realmente necesario?**
   - ✅ Decisión arquitectónica importante
   - ✅ Feature complejo (3+ archivos, 2+ capas)
   - ✅ Patrón repetible
   - ❌ Bug fix (va en commit)
   - ❌ Refactor sin cambio de comportamiento
   - ❌ Debugging temporal

3. **¿Dónde va?**
   - Decisión arquitectónica → ADR
   - Guía paso a paso → guides/
    - Cambio en API → actualizar `docs/api/`
   - Setup/troubleshooting → actualizar `getting-started/setup.md`
   - Concepto arquitectónico → actualizar `architecture/*.md`

4. **¿Tiene ejemplos?**
   - TODO código debe ser copy/paste funcional
   - Incluir imports necesarios
   - Comentar decisiones no obvias

---

## Anti-Patrones (NO hacer)

### ❌ Documentation Dumping
```markdown
# ❌ FRONTEND_DIAGNOSTICO.md (800 líneas de debugging)
[Logs de debugging session...]
```
**Fix:** Borrá el archivo. Debugging va en commits, no en docs.

---

### ❌ README Inception
```
frontend/src/components/ui/README.md
frontend/src/components/layouts/README.md
frontend/src/components/shared/README.md
```
**Fix:** Consolidar en `docs/guides/ui-components.md`

---

### ❌ Future Maybe Docs
```markdown
# ❌ docs/future/rate-limiting-proposal.md (1500 líneas, nunca implementado)
```
**Fix:** Si no está implementado → GitHub Issue. Si se implementa → ADR.

---

### ❌ Copy/Paste de Docs Externas
```markdown
# ❌ docs/flask-jwt-extended-full-docs.md
[Toda la doc de Flask-JWT-Extended copiada...]
```
**Fix:** Link a docs oficiales. Solo documentar decisiones específicas del proyecto.

---

## Ejemplos del Proyecto

### ADRs Existentes
- [001-jwt-cookies-httponly.md](../adr/001-jwt-cookies-httponly.md)
- [002-wizard-onboarding.md](../adr/002-wizard-onboarding.md)

### Guías Existentes
- [adding-feature.md](../guides/adding-feature.md)
- [ui-components.md](../guides/ui-components.md)
- [testing.md](../guides/testing.md)

**Mirá estos archivos para entender cómo aplicar los templates en el contexto real del proyecto.**

---

## Mantenimiento de Templates

**Si encontrás que los templates necesitan mejoras:**

1. Crear issue describiendo el problema
2. Proponer cambio en PR
3. Actualizar este README si cambia la estructura

**No modificar templates sin consenso.** Mantener consistencia es clave.

---

## Referencias

- [Documentación general](../README.md)
- [AGENTS.md - Sección Documentación](../../AGENTS.md#-estrategia-de-documentación-crítico-para-agentes)
- [ADR Pattern](https://adr.github.io/)
