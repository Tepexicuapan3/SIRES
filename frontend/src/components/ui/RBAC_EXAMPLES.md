# Ejemplos de Componentes RBAC (Metro CDMX)

> Componentes shadcn/ui adaptados al sistema de diseño Metro CDMX para el módulo RBAC.

---

## 1. Table — Listado de Roles y Permisos

### Uso Básico

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

export function RolesTable() {
  const roles = [
    { id: 1, nombre: "ROL_ADMIN", permisos: 45, usuarios: 3 },
    { id: 2, nombre: "ROL_MEDICO", permisos: 12, usuarios: 28 },
    { id: 3, nombre: "ROL_ENFERMERIA", permisos: 8, usuarios: 42 },
  ];

  return (
    <Table>
      <TableCaption>Roles del sistema SIRES</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Rol</TableHead>
          <TableHead>Permisos</TableHead>
          <TableHead className="text-right">Usuarios</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((rol) => (
          <TableRow key={rol.id}>
            <TableCell className="font-medium">{rol.nombre}</TableCell>
            <TableCell>{rol.permisos}</TableCell>
            <TableCell className="text-right">{rol.usuarios}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**Tokens usados:**
- Bordes: `border-line-struct`
- Hover: `hover:bg-subtle`
- Texto: `txt-body`, `txt-muted`

---

## 2. Dialog — Modal de Asignación de Permisos

### Uso con Formulario

```tsx
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AsignarPermisoDialog() {
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica de asignación
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Asignar Permiso</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Permiso a Rol</DialogTitle>
          <DialogDescription>
            Seleccioná el permiso que querés agregar a este rol.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="permiso">Permiso</Label>
              <Input
                id="permiso"
                placeholder="Ej: expedientes:read"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Asignar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Tokens usados:**
- Background modal: `bg-paper-lift`
- Bordes: `border-line-struct`
- Descripción: `txt-muted`
- Focus close button: `focus:ring-brand`

---

## 3. Select — Selector de Roles

### Uso en Formulario

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function RoleSelector() {
  return (
    <div className="grid gap-2">
      <Label htmlFor="rol">Rol del Usuario</Label>
      <Select name="rol">
        <SelectTrigger id="rol">
          <SelectValue placeholder="Seleccioná un rol" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ROL_ADMIN">Administrador</SelectItem>
          <SelectItem value="ROL_MEDICO">Médico</SelectItem>
          <SelectItem value="ROL_ENFERMERIA">Enfermería</SelectItem>
          <SelectItem value="ROL_RECEPCION">Recepción</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

**Tokens usados:**
- Borde trigger: `border-line-struct`
- Focus: `focus-visible:ring-brand/50`
- Placeholder: `txt-hint`
- Dropdown bg: `bg-paper-lift`
- Item hover: `focus:bg-subtle`

---

## 4. Badge — Tags de Permisos

### Variantes Disponibles

```tsx
import { Badge } from "@/components/ui/badge";

export function PermissionBadges() {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Default (naranja Metro) */}
      <Badge variant="default">Activo</Badge>

      {/* Estados clínicos (para feedback) */}
      <Badge variant="critical">Sin Acceso</Badge>
      <Badge variant="alert">Pendiente</Badge>
      <Badge variant="stable">Aprobado</Badge>
      <Badge variant="info">En Revisión</Badge>

      {/* Neutros */}
      <Badge variant="secondary">Inactivo</Badge>
      <Badge variant="outline">Heredado</Badge>
    </div>
  );
}
```

### Uso en Tabla de Permisos

```tsx
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PermissionsTable() {
  const permisos = [
    { id: 1, nombre: "expedientes:read", estado: "stable", rol: "ROL_MEDICO" },
    { id: 2, nombre: "expedientes:write", estado: "alert", rol: "ROL_MEDICO" },
    { id: 3, nombre: "usuarios:delete", estado: "critical", rol: "ROL_ADMIN" },
    { id: 4, nombre: "reportes:export", estado: "info", rol: "ROL_ADMIN" },
  ];

  const variantMap = {
    stable: "stable",
    alert: "alert",
    critical: "critical",
    info: "info",
  } as const;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Permiso</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {permisos.map((permiso) => (
          <TableRow key={permiso.id}>
            <TableCell className="font-medium">{permiso.nombre}</TableCell>
            <TableCell>
              <Badge variant="outline">{permiso.rol}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={variantMap[permiso.estado as keyof typeof variantMap]}>
                {permiso.estado === "stable" && "Activo"}
                {permiso.estado === "alert" && "Pendiente"}
                {permiso.estado === "critical" && "Bloqueado"}
                {permiso.estado === "info" && "En Revisión"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**Variantes Metro:**
- `default` → `bg-brand` (naranja Metro)
- `critical` → `bg-status-critical/10` (errores)
- `alert` → `bg-status-alert/10` (advertencias)
- `stable` → `bg-status-stable/10` (éxito)
- `info` → `bg-status-info/10` (información)
- `secondary` → `bg-subtle` (neutro)
- `outline` → `border-line-struct` (borde sutil)

---

## 5. Card — Página de Landing RBAC

### Uso en Dashboard

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function RBACDashboard() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Card 1: Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Roles del Sistema</CardTitle>
          <CardDescription>
            Gestioná los roles y permisos de usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-txt-body">8</span>
            <Badge variant="stable">Activos</Badge>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Ver todos los roles
          </Button>
        </CardFooter>
      </Card>

      {/* Card 2: Permisos */}
      <Card>
        <CardHeader>
          <CardTitle>Permisos Configurados</CardTitle>
          <CardDescription>
            Permisos disponibles en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-txt-body">142</span>
            <Badge variant="info">Registrados</Badge>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Administrar permisos
          </Button>
        </CardFooter>
      </Card>

      {/* Card 3: Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Activos</CardTitle>
          <CardDescription>
            Usuarios con roles asignados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-txt-body">73</span>
            <Badge variant="stable">En línea</Badge>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Ver usuarios
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

**Tokens usados:**
- Card bg: `bg-paper`
- Bordes: `border-line-struct`
- Title: `font-semibold` (Manrope)
- Description: `txt-muted`
- Texto principal: `txt-body`

---

## 6. Composición Completa — Página RBAC Real

```tsx
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function RBACManagementPage() {
  const [selectedRole, setSelectedRole] = useState("");

  const usuarios = [
    {
      id: 1,
      nombre: "Dr. Juan Pérez",
      usuario: "jperez",
      rol: "ROL_MEDICO",
      estado: "stable",
    },
    {
      id: 2,
      nombre: "Lic. María González",
      usuario: "mgonzalez",
      rol: "ROL_ADMIN",
      estado: "stable",
    },
    {
      id: 3,
      nombre: "Enf. Carlos Ruiz",
      usuario: "cruiz",
      rol: "ROL_ENFERMERIA",
      estado: "alert",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading text-txt-body">
          Gestión de Roles y Permisos
        </h1>
        <p className="text-txt-muted mt-2">
          Administrá roles, permisos y asignaciones de usuarios del sistema SIRES
        </p>
      </div>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuarios del Sistema</CardTitle>
              <CardDescription>
                Lista completa de usuarios con sus roles asignados
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Asignar Rol</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Asignar Rol a Usuario</DialogTitle>
                  <DialogDescription>
                    Seleccioná el usuario y el rol que querés asignar
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="rol-select">Rol</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger id="rol-select">
                        <SelectValue placeholder="Seleccioná un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ROL_ADMIN">Administrador</SelectItem>
                        <SelectItem value="ROL_MEDICO">Médico</SelectItem>
                        <SelectItem value="ROL_ENFERMERIA">Enfermería</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancelar</Button>
                  <Button>Asignar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.usuario}</TableCell>
                  <TableCell>{usuario.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{usuario.rol}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={usuario.estado === "stable" ? "stable" : "alert"}
                    >
                      {usuario.estado === "stable" ? "Activo" : "Pendiente"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Resumen de Tokens Metro Usados

### Colores
- **Marca:** `bg-brand`, `text-brand`, `bg-brand-hover`
- **Estados:** `status-critical`, `status-alert`, `status-stable`, `status-info`
- **Texto:** `txt-body`, `txt-muted`, `txt-hint`, `txt-inverse`
- **Superficies:** `bg-paper`, `bg-paper-lift`, `bg-subtle`
- **Bordes:** `line-struct`, `line-hairline`

### Tipografía
- **Body:** `font-body` (Inter) — texto general
- **Headings:** `font-heading` (Manrope) — títulos
- **Decorativo:** `font-metro` (METRO-DF) — uso especial

### Accesibilidad
- ✅ Todos los componentes tienen **keyboard navigation**
- ✅ Roles ARIA completos (`role`, `aria-*`)
- ✅ Focus states visibles (`focus-visible:ring-brand`)
- ✅ Disabled states claros (`disabled:opacity-50`)
- ✅ Contraste cumple WCAG AA

---

## Guía de Uso Rápida

1. **Table** → Listados de datos (roles, permisos, usuarios)
2. **Dialog** → Modales de creación/edición/asignación
3. **Select** → Selección de roles en formularios
4. **Badge** → Tags de estado, permisos, roles
5. **Card** → Contenedores de información en dashboard

**Todos los componentes usan tokens Metro CDMX** — no hay colores hardcodeados.
