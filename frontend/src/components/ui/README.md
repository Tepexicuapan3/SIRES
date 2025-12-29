# Componentes UI - SIRES Metro CDMX

Este directorio contiene los componentes primitivos de la UI, basados en **shadcn/ui** pero adaptados al sistema de diseño **Metro CDMX**.

## Filosofía

Los componentes de esta carpeta son **primitivos**: bloques de construcción básicos, reutilizables y sin lógica de negocio. Piensen en ellos como los ingredientes de una receta, no la receta completa.

### Reglas de Oro

1. ✅ **Usar tokens semánticos** → `bg-brand`, `txt-body`, `status-critical`
2. ❌ **NO hardcodear colores** → Evitar `bg-orange-500`, `text-gray-600`
3. ✅ **Accesibilidad completa** → ARIA, keyboard nav, focus states
4. ✅ **Usar CVA para variantes** → Type-safe variant system
5. ✅ **forwardRef en primitivos** → Para compatibilidad con React Hook Form

---

## Componentes Disponibles

### Button

Botón principal del sistema con variantes para diferentes acciones.

**Instalación:**
```bash
npx shadcn@latest add button
```

**Uso básico:**
```tsx
import { Button } from "@/components/ui/button";

<Button>Guardar Expediente</Button>
<Button variant="destructive">Eliminar</Button>
<Button variant="outline">Cancelar</Button>
<Button variant="ghost" size="icon">
  <X className="h-4 w-4" />
</Button>
```

**Variantes:**
- `default`: Acción primaria (naranja Metro)
- `destructive`: Acciones destructivas (rojo clínico)
- `outline`: Acciones secundarias (borde visible)
- `secondary`: Acciones terciarias (fondo sutil)
- `ghost`: Navegación/acciones discretas
- `link`: Estilo de enlace

**Tamaños:**
- `sm`: 36px altura
- `default`: 40px altura
- `lg`: 48px altura
- `icon`, `icon-sm`, `icon-lg`: Botones cuadrados para íconos

---

### ScrollArea

Componente de scroll personalizado (ya instalado).

**Uso:**
```tsx
import { ScrollArea } from "@/components/ui/ScrollArea";

<ScrollArea className="h-[400px]">
  {/* Contenido largo */}
</ScrollArea>
```

---

### Toaster (Sonner)

Sistema de notificaciones toast (ya instalado y configurado).

**Uso:**
```tsx
import { toast } from "sonner";

// Éxito
toast.success("Expediente guardado correctamente");

// Error
toast.error("No se pudo guardar el expediente");

// Warning
toast.warning("Revise los campos obligatorios");

// Info
toast.info("Se actualizarán los datos en 5 minutos");
```

El componente ya está integrado con los tokens Metro (status-critical, status-stable, etc.).

---

## Tokens de Color

### Marca Metro CDMX
```tsx
bg-brand         // #fe5000 - Naranja institucional
text-brand       // #fe5000
border-brand     // #fe5000
bg-brand-hover   // #d94300 - Hover state
```

### Estados Clínicos
```tsx
status-critical  // #ef4444 - Errores, alertas vitales
status-alert     // #f59e0b - Advertencias, pendientes
status-stable    // #10b981 - Éxito, signos estables
status-info      // #3b82f6 - Información administrativa
```

### Texto y Legibilidad
```tsx
txt-body         // #111827 - Texto principal
txt-muted        // #64748b - Metadatos, secundario
txt-hint         // #94a3b8 - Placeholders
txt-inverse      // #ffffff - Texto sobre fondos oscuros
```

### Superficies
```tsx
bg-app           // #f3f4f6 - Fondo general
bg-paper         // #ffffff - Tarjetas, expedientes
bg-paper-lift    // #ffffff - Modales, dropdowns
bg-subtle        // #f8fafc - Áreas secundarias
```

### Bordes
```tsx
line-hairline    // #e2e8f0 - Divisiones sutiles
line-struct      // #cbd5e1 - Bordes de inputs
```

---

## Patrón de Componente

Todos los componentes siguen este patrón:

```tsx
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// 1. Definir variantes con CVA usando tokens Metro
const componentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "bg-brand text-txt-inverse",
        // ...
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// 2. Tipar props con TS estricto
export interface ComponentProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof componentVariants> {}

// 3. forwardRef para primitivos
const Component = forwardRef<HTMLElement, ComponentProps>(
  ({ className, variant, ...props }, ref) => (
    <element
      ref={ref}
      className={cn(componentVariants({ variant, className }))}
      {...props}
    />
  )
);

Component.displayName = "Component";

export { Component, componentVariants };
```

---

## Instalación de Nuevos Componentes

### Paso 1: Instalar desde shadcn

```bash
cd frontend
npx shadcn@latest add <component-name>
```

### Paso 2: Adaptar a tokens Metro

Reemplazar las variables genéricas de shadcn por nuestros tokens:

```tsx
// ❌ ANTES (shadcn default)
"bg-primary text-primary-foreground"

// ✅ DESPUÉS (Metro CDMX)
"bg-brand text-txt-inverse hover:bg-brand-hover"
```

### Paso 3: Documentar

Agregar el componente a este README con ejemplos de uso.

---

### Table

Componente de tabla para listados de datos (roles, permisos, usuarios).

**Instalación:**
```bash
npx shadcn@latest add table
```

**Uso básico:**
```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

<Table>
  <TableCaption>Lista de roles del sistema</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Rol</TableHead>
      <TableHead>Permisos</TableHead>
      <TableHead>Usuarios</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>ROL_ADMIN</TableCell>
      <TableCell>45</TableCell>
      <TableCell>3</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Tokens usados:**
- Bordes: `border-line-struct`
- Hover: `hover:bg-subtle`
- Footer: `bg-subtle`
- Caption: `text-txt-muted`

---

### Dialog

Modal para formularios, confirmaciones y asignación de permisos.

**Instalación:**
```bash
npx shadcn@latest add dialog
```

**Uso básico:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Asignar Permiso</DialogTitle>
      <DialogDescription>
        Seleccioná el permiso para este rol
      </DialogDescription>
    </DialogHeader>
    {/* Contenido del formulario */}
    <DialogFooter>
      <Button variant="outline">Cancelar</Button>
      <Button>Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Tokens usados:**
- Background: `bg-paper-lift`
- Overlay: `bg-black/50`
- Bordes: `border-line-struct`
- Description: `text-txt-muted`
- Focus: `focus:ring-brand`

---

### Select

Dropdown para selección de roles y opciones.

**Instalación:**
```bash
npx shadcn@latest add select
```

**Uso básico:**
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Seleccioná un rol" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="ROL_ADMIN">Administrador</SelectItem>
    <SelectItem value="ROL_MEDICO">Médico</SelectItem>
    <SelectItem value="ROL_ENFERMERIA">Enfermería</SelectItem>
  </SelectContent>
</Select>
```

**Tokens usados:**
- Borde: `border-line-struct`
- Focus: `focus-visible:ring-brand/50`
- Placeholder: `text-txt-hint`
- Dropdown bg: `bg-paper-lift`
- Item hover: `focus:bg-subtle`

---

### Badge

Tags para mostrar estados, permisos y roles.

**Instalación:**
```bash
npx shadcn@latest add badge
```

**Uso básico:**
```tsx
import { Badge } from "@/components/ui/badge";

{/* Variante default (naranja Metro) */}
<Badge>Activo</Badge>

{/* Estados clínicos */}
<Badge variant="critical">Bloqueado</Badge>
<Badge variant="alert">Pendiente</Badge>
<Badge variant="stable">Aprobado</Badge>
<Badge variant="info">En Revisión</Badge>

{/* Neutros */}
<Badge variant="secondary">Inactivo</Badge>
<Badge variant="outline">Heredado</Badge>
```

**Variantes disponibles:**
- `default`: Marca Metro (naranja)
- `critical`: Errores/alertas críticas
- `alert`: Advertencias
- `stable`: Éxito/confirmación
- `info`: Información
- `secondary`: Neutro con fondo
- `outline`: Neutro con borde

**Tokens usados:**
- Default: `bg-brand`, `text-txt-inverse`
- Critical: `bg-status-critical/10`, `text-status-critical`
- Alert: `bg-status-alert/10`, `text-status-alert`
- Stable: `bg-status-stable/10`, `text-status-stable`
- Info: `bg-status-info/10`, `text-status-info`
- Outline: `border-line-struct`

---

### Card

Contenedor para secciones de información (dashboard, estadísticas).

**Instalación:**
```bash
npx shadcn@latest add card
```

**Uso básico:**
```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Roles del Sistema</CardTitle>
    <CardDescription>
      Gestioná los roles y permisos
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold">8</p>
  </CardContent>
  <CardFooter>
    <Button variant="outline">Ver todos</Button>
  </CardFooter>
</Card>
```

**Tokens usados:**
- Background: `bg-paper`
- Bordes: `border-line-struct`
- Description: `text-txt-muted`
- Text: `text-txt-body`

---

## Ejemplos Completos

Ver **[RBAC_EXAMPLES.md](./RBAC_EXAMPLES.md)** para ejemplos de uso completos con composiciones reales de estos componentes en páginas RBAC.

---

## Componentes Recomendados para Instalar

Para un sistema clínico como SIRES, estos componentes son útiles:

### Formularios
```bash
npx shadcn@latest add input label textarea select checkbox radio-group switch
```

### Feedback
```bash
npx shadcn@latest add alert dialog alert-dialog toast
```

### Navegación
```bash
npx shadcn@latest add tabs dropdown-menu navigation-menu
```

### Data Display
```bash
npx shadcn@latest add table card badge avatar separator
```

### Layout
```bash
npx shadcn@latest add sheet accordion collapsible
```

---

## Recursos

- [Documentación shadcn/ui](https://ui.shadcn.com)
- [Sistema de tokens Metro](../../styles/theme.css)
- [Prompt del agente ui-designer](../../../.opencode/prompts/ui-designer.md)

---

## Notas Importantes

### ¿Cuándo crear un componente custom vs usar shadcn?

| Situación | Acción |
|-----------|--------|
| Componente genérico (botón, input) | Usar shadcn + adaptar tokens |
| Componente muy específico de SIRES (FormularioExpediente) | Crear custom en `features/` |
| Componente shadcn necesita muchos cambios | Crear custom inspirándose en shadcn |

### Estructura de carpetas

```
frontend/src/components/
  ui/              # ← Primitivos shadcn (Button, Input, Dialog)
  layouts/         # ← Layout components (Sidebar, Header, Footer)
  shared/          # ← Reutilizables no-primitivos (LoadingSpinner)
```

### Accesibilidad

Todos los componentes deben:
- ✅ Tener roles ARIA correctos
- ✅ Soportar navegación por teclado
- ✅ Indicar estados (disabled, readonly, required)
- ✅ Tener focus visible
- ✅ Asociar labels a inputs

---

**Pro tip:** Usá el comando `/ui` con el agente `ui-designer` para automatizar la creación/adaptación de componentes.

```bash
/ui create dialog
/ui refactor frontend/src/components/ui/FormField.tsx
/ui audit
```
