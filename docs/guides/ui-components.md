# Componentes UI - shadcn/ui + Metro CDMX

Sistema de diseño basado en primitivos shadcn adaptados al branding Metro CDMX.

---

## Filosofía

**shadcn/ui** = Estructura + Accesibilidad
**Metro CDMX** = Identidad + Colores

No copiamos componentes literalmente. Los adaptamos con tokens semánticos.

---

## Tokens de Color (USAR SIEMPRE)

### Marca Metro CDMX

```css
bg-brand             /* Naranja #fe5000 */
text-brand
border-brand
bg-brand-hover       /* Hover state */
```

### Estados Clínicos

```css
status-critical      /* Rojo - Errores, alertas vitales */
status-alert         /* Ámbar - Advertencias, pendientes */
status-stable        /* Verde - Éxito, signos normales */
status-info          /* Azul - Información administrativa */
```

### Texto

```css
txt-body             /* Texto principal (#171717) */
txt-muted            /* Metadatos, secundario (#737373) */
txt-hint             /* Placeholders (#a3a3a3) */
txt-inverse          /* Sobre fondos oscuros (white) */
```

### Superficies

```css
bg-app               /* Fondo general (#fafafa) */
bg-paper             /* Tarjetas, expedientes (white) */
bg-paper-lift        /* Modales, dropdowns (white + shadow) */
bg-subtle            /* Áreas secundarias (#f5f5f5) */
```

### Bordes

```css
line-hairline        /* Divisiones sutiles (#e5e5e5) */
line-struct          /* Bordes de inputs, cards (#d4d4d4) */
```

**⚠️ NUNCA usar:**
- `bg-orange-500`, `text-gray-600` (colores directos)
- `#fe5000` inline (hardcoded hex)

---

## Instalación de Componentes

### CLI shadcn

```bash
cd frontend

# Instalar componente individual
npx shadcn@latest add button

# Instalar múltiples
npx shadcn@latest add button input label dialog

# Ver diferencias (útil para updates)
npx shadcn@latest diff
```

### Configuración (Ya está lista)

```json
// frontend/components.json
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/index.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

---

## Componentes Disponibles

### Button

**Instalado:** ✅  
**Archivo:** `frontend/src/components/ui/button.tsx`

**Variantes:**

```tsx
import { Button } from "@/components/ui/button";

// Acción primaria (naranja Metro)
<Button variant="default">Guardar</Button>

// Destructiva (rojo clínico)
<Button variant="destructive">Eliminar</Button>

// Secundaria
<Button variant="outline">Cancelar</Button>
<Button variant="secondary">Ver detalles</Button>

// Discreta
<Button variant="ghost">Cerrar</Button>
<Button variant="link">Ir a expedientes</Button>
```

**Tamaños:**

```tsx
<Button size="sm">Pequeño</Button>
<Button size="default">Normal</Button>
<Button size="lg">Grande</Button>

<Button size="icon"><Plus /></Button>
<Button size="icon-sm"><X /></Button>
<Button size="icon-lg"><Menu /></Button>
```

**Props importantes:**

```tsx
<Button disabled={isPending}>
  {isPending ? "Guardando..." : "Guardar"}
</Button>

<Button asChild>
  <Link to="/expedientes">Ir</Link>
</Button>
```

---

### Input + Label + FormField

**FormField (Custom):** ✅  
**Archivo:** `frontend/src/components/ui/FormField.tsx`

**Uso básico:**

```tsx
import { FormField } from "@/components/ui/FormField";
import { useForm } from "react-hook-form";

const { register, formState: { errors } } = useForm();

<FormField
  id="usuario"
  label="Usuario"
  icon={<User size={18} />}
  error={errors.usuario}
  helperText="3-20 caracteres"
  {...register("usuario")}
/>
```

**Props:**

| Prop | Tipo | Descripción |
|------|------|-------------|
| `id` | string | ID del input (required) |
| `label` | string | Label del campo |
| `icon` | ReactNode | Icono izquierdo (lucide-react) |
| `error` | FieldError | Error de React Hook Form |
| `helperText` | string | Texto de ayuda |
| `className` | string | Clases adicionales |

---

### Select

**Instalado:** ✅  
**Archivo:** `frontend/src/components/ui/select.tsx`

**Uso:**

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<Select onValueChange={(value) => setRole(value)}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Selecciona un rol" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Administrador</SelectItem>
    <SelectItem value="2">Médico</SelectItem>
    <SelectItem value="3">Recepción</SelectItem>
  </SelectContent>
</Select>
```

**Con React Hook Form:**

```tsx
import { Controller } from "react-hook-form";

<Controller
  name="id_rol"
  control={control}
  render={({ field }) => (
    <Select onValueChange={field.onChange} value={field.value}>
      <SelectTrigger>
        <SelectValue placeholder="Rol" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">Admin</SelectItem>
      </SelectContent>
    </Select>
  )}
/>
```

---

### Card

**Instalado:** ✅  
**Archivo:** `frontend/src/components/ui/card.tsx`

**Uso:**

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Expediente #12345</CardTitle>
    <CardDescription>Última actualización: 05/01/2026</CardDescription>
  </CardHeader>
  
  <CardContent>
    <p>Contenido del expediente...</p>
  </CardContent>
  
  <CardFooter>
    <Button>Ver completo</Button>
  </CardFooter>
</Card>
```

---

### Dialog (Modal)

**Instalado:** ✅  
**Archivo:** `frontend/src/components/ui/dialog.tsx`

**Uso:**

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";

const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>¿Eliminar expediente?</DialogTitle>
      <DialogDescription>
        Esta acción no se puede deshacer.
      </DialogDescription>
    </DialogHeader>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        Eliminar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Badge

**Instalado:** ✅  
**Archivo:** `frontend/src/components/ui/badge.tsx`

**Variantes adaptadas a Metro:**

```tsx
import { Badge } from "@/components/ui/badge";

// Estados clínicos
<Badge variant="critical">Urgente</Badge>
<Badge variant="alert">Pendiente</Badge>
<Badge variant="stable">Completado</Badge>
<Badge variant="info">En proceso</Badge>

// Secundarios
<Badge variant="secondary">Inactivo</Badge>
<Badge variant="outline">Draft</Badge>
```

**Ejemplo en tabla:**

```tsx
<td>
  {expediente.estado === "URGENTE" && <Badge variant="critical">Urgente</Badge>}
  {expediente.estado === "NORMAL" && <Badge variant="stable">Normal</Badge>}
</td>
```

---

### Table

**Instalado:** ✅  
**Archivo:** `frontend/src/components/ui/table.tsx`

**Uso:**

```tsx
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Folio</TableHead>
      <TableHead>Paciente</TableHead>
      <TableHead>Fecha</TableHead>
      <TableHead>Estado</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {expedientes.map((exp) => (
      <TableRow key={exp.id}>
        <TableCell>{exp.folio}</TableCell>
        <TableCell>{exp.paciente}</TableCell>
        <TableCell>{exp.fecha}</TableCell>
        <TableCell>
          <Badge variant={exp.urgente ? "critical" : "stable"}>
            {exp.estado}
          </Badge>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### Scroll Area

**Instalado:** ✅  
**Archivo:** `frontend/src/components/ui/scroll-area.tsx`

**Uso:**

```tsx
import { ScrollArea } from "@/components/ui/scroll-area";

<ScrollArea className="h-[400px] w-full">
  {/* Contenido largo */}
</ScrollArea>
```

---

### Toast (Notificaciones)

**Instalado:** ✅ (usando `sonner`)  
**Configurado en:** `frontend/src/providers/AppProviders.tsx`

**Uso:**

```tsx
import { toast } from "sonner";

// Success
toast.success("Expediente creado correctamente");

// Error
toast.error("No se pudo guardar el expediente");

// Info
toast.info("Procesando solicitud...");

// Warning
toast.warning("Atención: Campo requerido");

// Loading
const loadingToast = toast.loading("Guardando...");
// ... después
toast.success("Guardado", { id: loadingToast });

// Con acción
toast("Expediente eliminado", {
  action: {
    label: "Deshacer",
    onClick: () => console.log("Deshacer"),
  },
});
```

---

## Flujo de Trabajo

### 1. Instalar componente shadcn

```bash
npx shadcn@latest add textarea
```

### 2. Adaptar tokens Metro

**❌ Código generado por shadcn:**

```tsx
className="bg-primary text-primary-foreground hover:bg-primary/90"
```

**✅ Adaptado a Metro:**

```tsx
className="bg-brand text-txt-inverse hover:bg-brand-hover"
```

### 3. Usar en tu feature

```tsx
import { Textarea } from "@/components/ui/textarea";

<Textarea placeholder="Observaciones médicas" />
```

---

## Patrón de Componente Custom

Si necesitás un componente que NO existe en shadcn:

```tsx
// frontend/src/components/ui/MyCustomComponent.tsx
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const myComponentVariants = cva(
  "base-classes", // Clases comunes
  {
    variants: {
      variant: {
        default: "bg-brand text-txt-inverse",
        outline: "border border-line-struct bg-paper",
      },
      size: {
        sm: "h-9 px-3",
        default: "h-10 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof myComponentVariants> {}

const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(myComponentVariants({ variant, size, className }))}
      {...props}
    />
  )
);
MyComponent.displayName = "MyComponent";

export { MyComponent, myComponentVariants };
```

**Reglas:**
- ✅ `forwardRef` (compatibilidad React Hook Form)
- ✅ CVA para variantes type-safe
- ✅ `cn()` para merge de clases
- ✅ Tokens Metro (nunca colores directos)

---

## Accesibilidad

Todos los componentes shadcn ya tienen:

- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Focus states
- ✅ Screen reader support

**NO los rompas** al personalizar. Ejemplo:

```tsx
// ❌ Mal (rompe accesibilidad)
<button className="...">Click</button>

// ✅ Bien (usa componente shadcn)
<Button>Click</Button>
```

---

## Testing Visual

**Archivo:** `frontend/src/components/ui/__component-showcase.tsx`

Página con todos los componentes para testing visual:

```tsx
export default function ComponentShowcase() {
  return (
    <div className="p-8 space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-4">Buttons</h2>
        <div className="flex gap-2">
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
        </div>
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Badges</h2>
        <div className="flex gap-2">
          <Badge variant="critical">Critical</Badge>
          <Badge variant="stable">Stable</Badge>
        </div>
      </section>
      
      {/* ... más componentes */}
    </div>
  );
}
```

**Acceder:**
```
http://localhost:5173/showcase
```

---

## Subagente ui-designer

### Comando `/ui`

**Crear componente:**
```bash
/ui create dropdown-menu
```

**Refactorizar:**
```bash
/ui refactor frontend/src/components/shared/MyComponent.tsx
```

**Auditar:**
```bash
/ui audit
```

**Instalar múltiples:**
```bash
/ui install button input label dialog
```

---

## Ejemplos Reales

### Formulario de Login

```tsx
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/button";
import { User, Lock } from "lucide-react";

<form onSubmit={handleSubmit}>
  <FormField
    id="usuario"
    label="Usuario"
    icon={<User size={18} />}
    error={errors.usuario}
    {...register("usuario")}
  />
  
  <FormField
    id="password"
    type="password"
    label="Contraseña"
    icon={<Lock size={18} />}
    error={errors.password}
    {...register("password")}
  />
  
  <Button type="submit" className="w-full" disabled={isPending}>
    Iniciar Sesión
  </Button>
</form>
```

### Modal de Confirmación

```tsx
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>¿Eliminar usuario?</DialogTitle>
      <DialogDescription>
        Esta acción no se puede deshacer.
      </DialogDescription>
    </DialogHeader>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setConfirmOpen(false)}>
        Cancelar
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        Eliminar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Tabla con Estados

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Expediente</TableHead>
      <TableHead>Estado</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {expedientes.map((exp) => (
      <TableRow key={exp.id}>
        <TableCell>{exp.folio}</TableCell>
        <TableCell>
          <Badge variant={exp.urgente ? "critical" : "stable"}>
            {exp.estado}
          </Badge>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## Próximos Pasos

1. **Ver componentes completos:** `frontend/src/components/ui/RBAC_EXAMPLES.md`
2. **Agregar feature:** `docs/guides/adding-feature.md`
3. **Sistema de diseño:** `frontend/src/styles/theme.css`

---

**Última actualización:** Enero 2026
