# Implementación Completa: shadcn/ui + Metro CDMX + Subagente UI Designer

## ✅ Resumen de Cambios

### 1. Bridge de Variables CSS
**Archivo:** `frontend/src/styles/theme.css`

Se agregó el mapeo de variables shadcn → tokens Metro CDMX:

```css
/* shadcn espera */      /* mapea a Metro */
--primary          →     var(--metro-orange-500)
--destructive      →     var(--clinical-critical)
--muted            →     var(--bg-subtle)
--border           →     var(--border-struct)
```

Esto permite que los componentes shadcn funcionen automáticamente con el sistema de colores Metro.

---

### 2. Subagente ui-designer
**Archivos modificados:**
- `.opencode/prompts/ui-designer.md` (prompt completo)
- `opencode.json` (registro del agente)

**Capacidades:**
- ✅ Crear componentes nuevos usando shadcn como base
- ✅ Refactorizar componentes existentes
- ✅ Auditar componentes UI
- ✅ Instalar y adaptar componentes shadcn automáticamente

**Comandos disponibles:**
```bash
/ui create button
/ui refactor frontend/src/components/ui/FormField.tsx
/ui audit
/ui install button input label
```

---

### 3. Comando Personalizado `/ui`
**Archivo:** `opencode.json`

Nuevo comando que invoca al subagente `ui-designer` con contexto específico de UI.

**Sintaxis:**
```bash
/ui <acción> <argumentos>
```

**Acciones:**
- `create <component>` - Crear componente desde shadcn
- `refactor <path>` - Migrar componente a shadcn
- `audit` - Revisar todos los componentes
- `install <components>` - Instalar múltiples componentes

---

### 4. Componente Button (Ejemplo)
**Archivo:** `frontend/src/components/ui/button.tsx`

Se instaló y adaptó el componente Button de shadcn al sistema Metro:

**Variantes disponibles:**
- `default` - Acción primaria (naranja Metro)
- `destructive` - Eliminar/cancelar (rojo clínico)
- `outline` - Acciones secundarias
- `secondary` - Acciones terciarias
- `ghost` - Navegación discreta
- `link` - Estilo de enlace

**Tamaños:**
- `sm`, `default`, `lg`
- `icon`, `icon-sm`, `icon-lg` (botones cuadrados)

**Características:**
- ✅ forwardRef para React Hook Form
- ✅ Tokens semánticos Metro (bg-brand, txt-inverse)
- ✅ Accesibilidad completa (focus, disabled, keyboard)
- ✅ Dark mode automático

---

### 5. Documentación

#### 5.1 `frontend/src/components/ui/README.md`
Guía completa de componentes UI:
- Tokens de color
- Patrón de componente
- Instalación de nuevos componentes
- Ejemplos de uso

#### 5.2 `AGENTS.md` (actualizado)
- Nueva tabla con agente `ui-designer`
- Sección completa de shadcn/ui + Metro
- Ejemplos de uso del comando `/ui`

#### 5.3 `PROJECT_GUIDE.md` (actualizado)
- Sección 5.1 con sistema de diseño
- Flujo de trabajo para componentes
- Tokens de color disponibles

---

## 🎯 Cómo Usar

### Escenario 1: Crear un componente nuevo

```bash
# Opción 1: CLI directo
cd frontend
npx shadcn@latest add dialog

# Opción 2: Con el agente (recomendado)
/ui install dialog
```

El agente automáticamente:
1. Instala el componente
2. Lo adapta a tokens Metro
3. Te muestra cómo usarlo

### Escenario 2: Refactorizar un componente existente

```bash
/ui refactor frontend/src/components/ui/FormField.tsx
```

El agente:
1. Analiza el componente actual
2. Propone mejoras
3. Migra a patrones shadcn (si aplica)
4. Pide confirmación antes de cambiar

### Escenario 3: Auditar todos los componentes

```bash
/ui audit
```

El agente revisa:
- ❌ Colores hardcodeados
- ✅ Uso correcto de tokens
- ✅ Accesibilidad (ARIA, keyboard)
- ✅ Patrones (CVA, forwardRef)

---

## 📊 Estado del Proyecto

| Aspecto | Estado | Notas |
|---------|--------|-------|
| **Bridge CSS** | ✅ Implementado | Variables shadcn → Metro mapeadas |
| **Subagente** | ✅ Configurado | Prompt completo con ejemplos |
| **Comando /ui** | ✅ Disponible | 4 acciones: create/refactor/audit/install |
| **Button** | ✅ Adaptado | Primer componente con tokens Metro |
| **Docs** | ✅ Completas | README + AGENTS + PROJECT_GUIDE |
| **MCP shadcn** | ⏸️ Pendiente | Se implementará si se necesita |

---

## 🚀 Próximos Pasos Recomendados

### Fase 1: Componentes Básicos (Corto plazo)
```bash
npx shadcn@latest add input label textarea
```

Estos son fundamentales para formularios médicos.

### Fase 2: Feedback y Navegación (Mediano plazo)
```bash
npx shadcn@latest add dialog alert-dialog tabs
```

Para modales, confirmaciones y navegación.

### Fase 3: Data Display (Largo plazo)
```bash
npx shadcn@latest add table card badge
```

Para mostrar expedientes, listas de pacientes, etc.

---

## 💡 Ejemplos de Uso Real

### Formulario de Login (con Button adaptado)

```tsx
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";

<form onSubmit={handleSubmit}>
  <FormField
    id="usuario"
    label="Usuario"
    {...register("usuario")}
  />
  
  <FormField
    id="password"
    type="password"
    label="Contraseña"
    {...register("password")}
  />
  
  <Button type="submit" className="w-full">
    Iniciar Sesión
  </Button>
</form>
```

### Modal de Confirmación

```tsx
import { Button } from "@/components/ui/button";
// Después de instalar: npx shadcn add dialog

<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>¿Eliminar expediente?</DialogTitle>
      <DialogDescription>
        Esta acción no se puede deshacer.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancelar</Button>
      <Button variant="destructive">Eliminar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 🎨 Sistema de Tokens (Referencia Rápida)

```tsx
// Acciones
bg-brand hover:bg-brand-hover         // Acción primaria
bg-status-critical                     // Destructiva
border-line-struct bg-paper            // Outline
bg-subtle                              // Secondary

// Estados
status-critical  // Rojo   - Errores
status-alert     // Ámbar  - Warnings
status-stable    // Verde  - Éxito
status-info      // Azul   - Info

// Texto
txt-body         // Principal
txt-muted        // Secundario
txt-hint         // Placeholder
txt-inverse      // Sobre fondos oscuros
```

---

## ⚠️ Reglas Importantes

1. **NUNCA** uses `bg-orange-500` o colores directos de Tailwind
2. **SIEMPRE** usa tokens: `bg-brand`, `status-critical`, etc.
3. **Componentes primitivos** → `components/ui/`
4. **Componentes específicos** → `features/<feature>/components/`
5. **forwardRef** obligatorio en primitivos (Button, Input)
6. **CVA** para variantes complejas
7. **Accesibilidad** no es opcional (ARIA, keyboard, focus)

---

## 🤝 Filosofía del Agente

El agente `ui-designer` está configurado para:

✅ **Enseñar** - Explica el "por qué" de cada decisión
✅ **Preguntar** - No asume, pide confirmación
✅ **Adaptar** - No copia shadcn literalmente, adapta a Metro
✅ **Documentar** - Muestra ejemplos de uso siempre

**NO** es un generador automático de código. Es un mentor que ayuda a construir UI consistente.

---

## 📞 Soporte

Si algo no funciona:

1. Verificá que las variables bridge estén en `theme.css`
2. Revisá que el componente use tokens semánticos
3. Consultá el README: `frontend/src/components/ui/README.md`
4. Usá el agente: `/ui` con tu pregunta específica

---

**Fecha de implementación:** 26 de diciembre de 2025  
**Versión:** 1.0.0  
**Sistema:** SIRES - Metro CDMX
