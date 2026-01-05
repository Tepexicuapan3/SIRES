# UI Components - shadcn/ui + Metro CDMX

> **Documentación completa:** [docs/guides/ui-components.md](../../../../docs/guides/ui-components.md)

Este directorio contiene los **componentes primitivos** de la UI, basados en **shadcn/ui** adaptados al sistema de diseño **Metro CDMX**.

---

## Quick Start

### Instalar componente shadcn

```bash
cd frontend
npx shadcn@latest add button
```

### Usar componente

```tsx
import { Button } from "@/components/ui/button";

<Button variant="default">Guardar</Button>
<Button variant="destructive">Eliminar</Button>
```

---

## Reglas de Oro

1. ✅ **Usar tokens semánticos** → `bg-brand`, `txt-body`, `status-critical`
2. ❌ **NO hardcodear colores** → Evitar `bg-orange-500`, `text-gray-600`
3. ✅ **Accesibilidad completa** → ARIA, keyboard nav, focus states
4. ✅ **forwardRef en primitivos** → Para compatibilidad con React Hook Form

---

## Tokens de Color (Quick Reference)

### Marca Metro CDMX
```css
bg-brand             /* Naranja #fe5000 */
bg-brand-hover       /* Hover state */
```

### Estados Clínicos
```css
status-critical      /* Rojo - Errores */
status-alert         /* Ámbar - Advertencias */
status-stable        /* Verde - Éxito */
status-info          /* Azul - Información */
```

### Texto
```css
txt-body             /* Texto principal */
txt-muted            /* Secundario */
txt-hint             /* Placeholders */
txt-inverse          /* Sobre fondos oscuros */
```

**Ver todos los tokens:** [docs/guides/ui-components.md#tokens-de-color](../../../../docs/guides/ui-components.md#tokens-de-color-usar-siempre)

---

## Componentes Disponibles

| Componente | Status | Documentación |
|------------|--------|---------------|
| Button | ✅ Instalado | [Ver docs](../../../../docs/guides/ui-components.md#button) |
| FormField | ✅ Custom | [Ver docs](../../../../docs/guides/ui-components.md#input--label--formfield) |
| Select | ✅ Instalado | [Ver docs](../../../../docs/guides/ui-components.md#select) |
| Dialog | ✅ Instalado | [Ver docs](../../../../docs/guides/ui-components.md#dialog) |
| ScrollArea | ✅ Instalado | [Ver docs](../../../../docs/guides/ui-components.md#scrollarea) |
| Toaster (Sonner) | ✅ Instalado | [Ver docs](../../../../docs/guides/ui-components.md#toaster-sonner) |

---

## Estructura del Directorio

```
components/ui/
├── button.tsx            # Botones con variantes Metro
├── FormField.tsx         # Campo de formulario integrado (custom)
├── select.tsx            # Selects accesibles
├── dialog.tsx            # Modales y diálogos
├── ScrollArea.tsx        # Scroll personalizado
├── ... (otros componentes shadcn)
└── README.md             # Este archivo
```

**Componente genérico → `ui/`**  
**Componente específico de feature → `features/<feature>/components/`**

---

## Crear Nuevo Componente

### Opción 1: Instalar desde shadcn

```bash
npx shadcn@latest add <component-name>
```

Luego adaptar colores a tokens Metro (ver [guía de adaptación](../../../../docs/guides/ui-components.md#adaptar-componente-shadcn)).

### Opción 2: Crear custom component

Seguir el [patrón de componente](../../../../docs/guides/ui-components.md#patrón-de-componente) en la docs.

---

## RBAC en Componentes UI

Usar el hook `usePermissions` para condicionar visibilidad:

```tsx
import { usePermissions } from "@/hooks/usePermissions";

const { can } = usePermissions();

<Button 
  onClick={handleDelete}
  disabled={!can("expedientes:delete")}
>
  Eliminar
</Button>
```

**Ver ejemplos completos:** [docs/guides/rbac-frontend.md](../../../../docs/guides/rbac-frontend.md)

---

## Referencias

- **Guía completa:** [docs/guides/ui-components.md](../../../../docs/guides/ui-components.md)
- **Docs shadcn/ui:** https://ui.shadcn.com
- **Sistema Metro:** `frontend/src/styles/theme.css`

---

**Última actualización:** Enero 2026
