# AGENT_DOCUMENTATION_CONFIG - Resumen de Configuración

**Fecha:** 2026-01-05  
**Tarea:** Configurar agentes AI para gestión inteligente de documentación  
**Estado:** ✅ COMPLETADO

---

## 📋 Cambios Realizados

### 1. Actualizado `AGENTS.md`

**Agregado:** Sección completa "📚 Estrategia de Documentación (CRÍTICO para Agentes)"

**Contenido:**
- ✅ Checklist: Cuándo SÍ documentar (decisiones arquitectónicas, features complejos, patrones repetibles)
- ❌ Checklist: Cuándo NO documentar (bug fixes, refactors, debugging)
- 🌳 Árbol de decisión: Dónde poner documentación (adr/ vs guides/ vs architecture/)
- 📏 Reglas de formato: Max 500 líneas, info esencial, ejemplos copy/paste
- 📝 Templates inline: ADR y Guía de Implementación
- 🚫 Anti-patrones: Documentation dumping, README inception, Future Maybe docs, Copy/paste externo
- 🔄 Workflow completo: 5 pasos desde pregunta hasta linkeo en docs/README.md
- 🛠️ Comandos: `/doc create`, `/doc adr`, `/doc update`, `/doc audit`

**Líneas agregadas:** ~450 líneas (de 400 → 850 líneas aprox)

**Ubicación en archivo:** Después de la sección "Desarrollo de UI con shadcn/ui + Metro CDMX"

---

### 2. Actualizado `opencode.json`

**Agregado:** Comando `/doc` para gestión de documentación

**Template del comando:**
```json
{
  "doc": {
    "template": "Gestionar documentación del proyecto SIRES...",
    "description": "Crear/actualizar/auditar documentación del proyecto",
    "agent": "JARVIS"
  }
}
```

**Acciones disponibles:**
- `create <nombre-guia>` - Crear nueva guía en docs/guides/
- `adr <titulo-decision>` - Crear ADR numerado en docs/adr/
- `update <path>` - Actualizar doc existente
- `audit` - Auditar docs (>500 líneas, archivos muertos, sin linkear)

**Agente asignado:** `JARVIS` (modo planeación, no edita archivos)

**Validaciones incluidas:**
- Verificar existencia antes de crear
- Máximo 500 líneas
- Linkear desde docs/README.md
- No duplicar contenido

---

### 3. Creados Templates de Documentación

#### 3.1 `docs/templates/guide-template.md`

**Propósito:** Guías paso a paso para implementar features/patrones

**Estructura:**
- TL;DR
- Contexto y Problema
- Prerequisitos
- Paso a Paso (con código copy/paste)
- Checklist Final
- Troubleshooting
- Ejemplos Completos
- Referencias

**Tamaño:** 82 líneas (incluyendo placeholders)

**Uso:**
```bash
opencode run --command doc "create adding-rbac-endpoint"
# → Genera docs/guides/adding-rbac-endpoint.md desde template
```

---

#### 3.2 `docs/templates/adr-template.md`

**Propósito:** Architecture Decision Records (decisiones importantes)

**Estructura:**
- Contexto y Problema
- Decisión tomada
- Alternativas Consideradas (con pros/contras)
- Consecuencias (positivas y negativas)
- Implementación (código + archivos)
- Validación y Métricas
- Referencias
- Histórico de Cambios

**Tamaño:** 149 líneas (incluyendo placeholders)

**Uso:**
```bash
opencode run --command doc "adr rate-limiting-strategy"
# → Genera docs/adr/003-rate-limiting-strategy.md (numeración automática)
```

---

#### 3.3 `docs/templates/README.md`

**Propósito:** Documentación de cómo usar los templates

**Contenido:**
- Cuándo usar cada template
- Cómo usar comando `/doc` vs manualmente
- Checklist pre-creación
- Anti-patrones con ejemplos
- Referencias a ADRs y guías existentes

**Tamaño:** 187 líneas

**Target:** Desarrolladores que crean documentación nueva

---

### 4. Actualizado `docs/README.md`

**Cambios:**

1. **Sección "Estructura":** Actualizada para mostrar templates/
   ```
   └── templates/                      # Templates para crear docs nuevos
       ├── guide-template.md           # Template guías
       ├── adr-template.md             # Template ADRs
       └── README.md                   # Cómo usar templates
   ```

2. **Nueva sección:** "📝 Contribuir a la Documentación"
   - Regla de oro (solo docs útiles)
   - Comandos `/doc`
   - Templates disponibles
   - Reglas de formato
   - Link a AGENTS.md sección Documentación

**Ubicación:** Antes de "Última actualización" (final del archivo)

---

## 🎯 Objetivos Logrados

### ✅ 1. Enseñar a agentes CUÁNDO documentar

**Implementado en:** `AGENTS.md` sección "Cuándo Documentar"

**Criterios claros:**
- Decisiones arquitectónicas → ADR
- Features complejos (3+ archivos) → guides/
- Patrones repetibles → guides/
- Bug fixes → NO documentar (commit message)
- Refactors → NO documentar (commit message)

---

### ✅ 2. Enseñar a agentes DÓNDE poner documentación

**Implementado en:** `AGENTS.md` sección "Dónde Poner la Documentación"

**Árbol de decisión:**
```
¿Es decisión arquitectónica? → docs/adr/
¿Es guía implementación? → docs/guides/
¿Es sistema general? → docs/architecture/
¿Es API reference? → docs/api/endpoints.md
¿Es setup? → docs/getting-started/setup.md
¿Es código específico? → Comentario inline
```

---

### ✅ 3. Enseñar a agentes CÓMO documentar

**Implementado en:** 
- `AGENTS.md` sección "Cómo Documentar"
- Templates con estructura predefinida

**Reglas:**
- Max 500 líneas (split si crece)
- Solo info esencial (no fluff)
- Ejemplos copy/paste funcionales
- Estructura predecible (usar templates)

---

### ✅ 4. Proveer herramientas (comandos + templates)

**Comandos `/doc`:**
- `create <nombre>` - Nueva guía
- `adr <titulo>` - Nuevo ADR
- `update <path>` - Actualizar existente
- `audit` - Auditar docs

**Templates:**
- `guide-template.md` - Guías paso a paso
- `adr-template.md` - Decisiones arquitectónicas
- `README.md` - Instrucciones de uso

---

### ✅ 5. Prevenir anti-patrones

**Documentados en:** `AGENTS.md` y `docs/templates/README.md`

**Anti-patrones identificados:**
1. **Documentation Dumping:** Logs de debugging como docs permanentes
2. **README Inception:** READMEs duplicados en cada carpeta
3. **Future Maybe Docs:** Diseños de features nunca implementadas
4. **Copy/Paste Externo:** Copiar docs de librerías externas

**Para cada uno:** Ejemplo malo + fix recomendado

---

## 📊 Métricas de Calidad

### Templates

| Template | Líneas | Secciones | Ejemplos | Copy/Paste Ready |
|----------|--------|-----------|----------|------------------|
| guide-template.md | 82 | 9 | 3 | ✅ Sí |
| adr-template.md | 149 | 10 | 2 | ✅ Sí |
| templates/README.md | 187 | 8 | 6 | ✅ Sí |

### Documentación de Agentes

| Sección | Líneas | Decisión Trees | Checklists | Comandos |
|---------|--------|----------------|------------|----------|
| Estrategia Documentación | ~450 | 1 | 2 (SÍ/NO) | 4 (/doc) |

---

## 🔧 Cómo Usar (Quick Start)

### Para Agentes AI

**Al implementar una feature nueva:**

1. **Preguntarse:** ¿Es compleja (3+ archivos, 2+ capas)?
   - SÍ → Crear guía con `/doc create <nombre>`
   - NO → Solo commit message

2. **Preguntarse:** ¿Es una decisión arquitectónica importante?
   - SÍ → Crear ADR con `/doc adr <titulo>`
   - NO → Continuar

3. **Siempre:** Actualizar docs existentes si cambia comportamiento
   - API cambió → `/doc update docs/api/endpoints.md`
   - Auth flow cambió → `/doc update docs/architecture/authentication.md`

4. **Periódicamente:** Auditar documentación
   - `/doc audit` (encuentra docs >500 líneas, referencias rotas, duplicados)

---

### Para Desarrolladores

**Crear documentación manualmente:**

```bash
# 1. Revisar templates
ls docs/templates/

# 2. Copiar template apropiado
cp docs/templates/guide-template.md docs/guides/mi-guia.md

# 3. Rellenar placeholders
# [Texto entre corchetes] → Tu contenido
# YYYY-MM-DD → Fecha actual

# 4. Validar
# - <500 líneas
# - Ejemplos funcionales
# - Sin duplicación

# 5. Linkear desde docs/README.md
# Agregar entrada en sección apropiada
```

**Usando comando `/doc` (recomendado):**

```bash
# Crear nueva guía
opencode run --command doc "create adding-websockets"

# Crear ADR
opencode run --command doc "adr websocket-vs-polling"

# Actualizar existente
opencode run --command doc "update docs/guides/testing.md"

# Auditar
opencode run --command doc "audit"
```

---

## 🧪 Testing de la Configuración

### Test 1: Comando `/doc create`

**Entrada:**
```bash
opencode run --command doc "create testing-backend"
```

**Output esperado:**
1. Agente `JARVIS` verifica que no exista `docs/guides/testing-backend.md`
2. Copia `docs/templates/guide-template.md` → `docs/guides/testing-backend.md`
3. Rellena metadata (fecha, autor)
4. Pregunta qué contenido incluir
5. Linkea desde `docs/README.md` sección apropiada

---

### Test 2: Comando `/doc adr`

**Entrada:**
```bash
opencode run --command doc "adr rate-limiting-redis"
```

**Output esperado:**
1. Agente verifica último ADR (002) → próximo es 003
2. Crea `docs/adr/003-rate-limiting-redis.md`
3. Usa template de ADR
4. Linkea desde `docs/README.md`

---

### Test 3: Comando `/doc audit`

**Entrada:**
```bash
opencode run --command doc "audit"
```

**Output esperado:**
Reporte con:
- Docs con >500 líneas (para split)
- Referencias a archivos borrados
- Docs no linkeados desde README
- Contenido duplicado entre archivos

---

## 📁 Archivos Creados/Modificados

```
SIRES/
├── AGENTS.md                                    # ✏️ MODIFICADO (+450 líneas)
├── opencode.json                                # ✏️ MODIFICADO (+comando /doc)
└── docs/
    ├── README.md                                # ✏️ MODIFICADO (+sección templates)
    └── templates/                               # ✨ NUEVO DIRECTORIO
        ├── guide-template.md                    # ✨ NUEVO (82 líneas)
        ├── adr-template.md                      # ✨ NUEVO (149 líneas)
        └── README.md                            # ✨ NUEVO (187 líneas)
```

**Total archivos nuevos:** 4 (1 directorio + 3 archivos)  
**Total archivos modificados:** 2  
**Líneas agregadas:** ~900 líneas

---

## 🎯 Próximos Pasos Recomendados

### Inmediato (Esta Sesión)

- [x] Crear templates de documentación
- [x] Actualizar AGENTS.md con estrategia
- [x] Agregar comando `/doc` a opencode.json
- [x] Actualizar docs/README.md con referencias

### Siguiente (Próxima Sesión)

1. **Testing de comandos:**
   - Probar `/doc create test-guide`
   - Probar `/doc adr test-decision`
   - Probar `/doc audit`
   - Validar que agentes siguen templates

2. **Commits:**
   ```bash
   # Commit 1: Documentación reorganizada (ya hecho)
   git add docs/ README.md REORGANIZATION_SUMMARY.md
   git commit -m "docs: reorganize into docs/ folder (26→11 files)"
   
   # Commit 2: Archivos obsoletos (pendiente)
   rm -f [10 archivos obsoletos de REORGANIZATION_SUMMARY.md]
   git add -u
   git commit -m "chore: remove 10 obsolete documentation files"
   
   # Commit 3: Configuración de agentes (NUEVO)
   git add AGENTS.md opencode.json docs/templates/ AGENT_DOCUMENTATION_CONFIG.md
   git commit -m "feat(agents): configure documentation management system

   - Add documentation strategy section to AGENTS.md
   - Add /doc command (create/adr/update/audit) to opencode.json
   - Create templates for guides and ADRs
   - Update docs/README.md with contribution guidelines
   
   Agents now know:
   - When to document (architectural decisions, complex features)
   - When NOT to document (bug fixes, refactors, debugging)
   - Where to put docs (decision tree: adr/ vs guides/ vs architecture/)
   - How to document (max 500 lines, essential only, copy/paste examples)"
   ```

3. **Validar links internos:**
   ```bash
   # Verificar que todos los links relativos funcionen
   grep -r "](\./" docs/ | grep -v ".git"
   ```

4. **Probar con feature real:**
   - Implementar una feature nueva
   - Verificar que agente pregunte "¿Necesita documentación?"
   - Validar que use templates correctos

---

## 💡 Lecciones Aprendidas

### ✅ Qué funcionó bien

1. **Templates estructurados:** Proveer esqueleto claro facilita creación consistente
2. **Árbol de decisión:** Elimina ambigüedad de "¿dónde va esto?"
3. **Anti-patrones documentados:** Mostrar ejemplos malos ayuda más que solo buenas prácticas
4. **Comandos integrados:** `/doc` centraliza toda la gestión de documentación

### ⚠️ Riesgos/Deuda Técnica

1. **No hay validación automática:** Los 500 líneas es manual (no hay CI check)
2. **Links rotos:** No hay script de validación de links internos
3. **Numeración ADRs:** Manual (podría fallar si 2 personas crean simultáneamente)

### 🔮 Mejoras Futuras

1. **Pre-commit hook:**
   ```bash
   # .git/hooks/pre-commit
   # Verificar docs <500 líneas, links válidos
   ```

2. **Script de auditoria:**
   ```bash
   # scripts/audit-docs.sh
   # - Contar líneas por archivo
   # - Verificar links internos
   # - Detectar duplicación (diff -r)
   ```

3. **Template para troubleshooting:**
   - Similar a guide-template.md pero solo troubleshooting
   - Para agregar a docs/getting-started/

---

## 📚 Referencias

### Documentación del Proyecto

- [`AGENTS.md`](../AGENTS.md) - Guía completa de agentes (ahora con sección Documentación)
- [`docs/README.md`](../docs/README.md) - Índice principal de documentación
- [`docs/templates/README.md`](../docs/templates/README.md) - Cómo usar templates
- [`REORGANIZATION_SUMMARY.md`](../REORGANIZATION_SUMMARY.md) - Resumen de reorganización anterior

### Archivos de Configuración

- [`opencode.json`](../opencode.json) - Configuración de OpenCode (comandos, agentes, MCPs)
- [`.opencode/prompts/`](../.opencode/prompts/) - System prompts por agente

### Templates Creados

- [`docs/templates/guide-template.md`](../docs/templates/guide-template.md)
- [`docs/templates/adr-template.md`](../docs/templates/adr-template.md)

### Ejemplos Existentes

- [`docs/adr/001-jwt-cookies-httponly.md`](../docs/adr/001-jwt-cookies-httponly.md)
- [`docs/adr/002-wizard-onboarding.md`](../docs/adr/002-wizard-onboarding.md)
- [`docs/guides/adding-feature.md`](../docs/guides/adding-feature.md)

---

**Última actualización:** 2026-01-05  
**Estado:** ✅ Completado y listo para testing  
**Próximo milestone:** Probar comandos `/doc` + hacer commits
