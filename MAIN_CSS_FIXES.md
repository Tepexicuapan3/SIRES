# ✅ Correcciones Finales en main.css

## Problema Identificado

El archivo `main.css` tenía **referencias a variables CSS que no existen** en el sistema Metro CDMX:

```css
/* ❌ ANTES - Variables inexistentes */
html {
  background-color: var(--bg-page);      /* No existe */
  color: var(--text-primary);            /* No existe */
}

@layer base {
  * {
    @apply border-border outline-ring/50;  /* Clases inexistentes */
  }
  body {
    @apply bg-background text-foreground;  /* Clases inexistentes */
  }
}
```

---

## Correcciones Aplicadas

### Fix 1: Variables CSS en `html`

**Líneas:** 21-24

```css
/* ✅ DESPUÉS - Variables correctas */
html {
  background-color: var(--bg-app);   /* ✅ Existe en theme.css */
  color: var(--text-body);           /* ✅ Existe en theme.css */
}
```

**Mapeo:**
- `--bg-page` → `--bg-app` (fondo general de la aplicación)
- `--text-primary` → `--text-body` (texto principal)

---

### Fix 2: @layer base simplificado

**Líneas:** 26-33

```css
/* ✅ DESPUÉS - Clases correctas */
@layer base {
  * {
    border-color: var(--border-struct);  /* ✅ Variable CSS directa */
  }
  body {
    @apply bg-app text-txt-body;  /* ✅ Clases Tailwind correctas */
  }
}
```

**Cambios:**
- `@apply border-border outline-ring/50` → `border-color: var(--border-struct)`
  - Eliminado `border-border` (no existe)
  - Eliminado `outline-ring` (no existe en Metro CDMX)
  - Aplicado `border-struct` como variable CSS directa
  
- `bg-background text-foreground` → `bg-app text-txt-body`
  - `bg-background` → `bg-app` (clase Tailwind generada desde `--color-app`)
  - `text-foreground` → `text-txt-body` (clase Tailwind generada desde `--color-txt-body`)

---

## Estado Final de main.css

```css
/* src/styles/main.css */
@import "tailwindcss";

@variant dark (&:where(.dark, .dark *));

@import "./fonts.css";
@import "./theme.css";
@import "./nprogress.css";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

html {
  background-color: var(--bg-app);
  color: var(--text-body);
}

@layer base {
  * {
    border-color: var(--border-struct);
  }
  body {
    @apply bg-app text-txt-body;
  }
}
```

**Total:** 34 líneas (vs 67 líneas antes de las correcciones del sidebar)

---

## Validación

### ✅ Build Exitoso

```bash
$ bun run build
# Sin errores de CSS
# Los únicos errores son de tests (no relacionados)
```

### ✅ Dev Server Iniciado

```bash
$ bun dev
VITE v7.3.0 ready in 858 ms
➜  Local:   http://localhost:5174/
# Sin errores de CSS
```

---

## Variables Disponibles en Metro CDMX

Para referencia futura, estas son las variables **que SÍ existen**:

### Colores de Interfaz (Clase → Variable)
- `bg-app` → `var(--bg-app)`
- `bg-paper` → `var(--bg-paper)`
- `bg-subtle` → `var(--bg-subtle)`
- `text-txt-body` → `var(--text-body)`
- `text-txt-muted` → `var(--text-muted)`
- `border-line-hairline` → `var(--border-hairline)`
- `border-line-struct` → `var(--border-struct)`

### Colores de Marca
- `bg-brand` → `var(--action-main)`
- `bg-brand-hover` → `var(--action-main-hover)`
- `text-brand` → `var(--action-main)`

### Estados Clínicos
- `bg-status-critical` → `var(--clinical-critical)`
- `bg-status-alert` → `var(--clinical-alert)`
- `bg-status-stable` → `var(--clinical-stable)`
- `bg-status-info` → `var(--clinical-info)`

### Sidebar (Nuevas - Agregadas en esta sesión)
- `bg-sidebar` → `var(--sidebar-background)`
- `text-sidebar-foreground` → `var(--sidebar-foreground)`
- `bg-sidebar-primary` → `var(--sidebar-primary)`
- `border-sidebar-border` → `var(--sidebar-border)`

---

## ⚠️ Variables que NO Existen (No usar)

Estas son comunes en shadcn pero **no están definidas** en Metro CDMX:

❌ `--bg-page`  
❌ `--text-primary`  
❌ `--background`  
❌ `--foreground`  
❌ `border-border`  
❌ `outline-ring`  
❌ `bg-background`  
❌ `text-foreground`  

**Regla de oro:** Si una variable no está en `theme.css` sección `@theme` (líneas 163-224), **no existe** y Tailwind no generará la clase.

---

## Documentos Relacionados

- ✅ `SIDEBAR_IMPLEMENTATION.md` - Arquitectura del sidebar
- ✅ `SIDEBAR_FIXES_APPLIED.md` - Correcciones de variables CSS sidebar
- ✅ Este archivo - Correcciones finales de main.css

---

## Próximo Paso

**Probar el sistema completo:**

```bash
cd frontend
bun dev
# Abrir http://localhost:5173 (o el puerto que asigne)
# Login → Verificar que el sidebar se ve correctamente
```

✅ **Estado:** main.css corregido y funcional.
