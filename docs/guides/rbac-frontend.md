# RBAC en Frontend - Guía Práctica

Ejemplos de implementación de permisos RBAC 2.0 en componentes, rutas y hooks.

> **TL;DR:** Usá `usePermissions()` para condicionar UI. Guardá `<ProtectedRoute>` para rutas. Implementá permisos granulares (`resource:action`).

> **Ver también:** [RBAC Architecture](../architecture/rbac.md) - Arquitectura completa backend + frontend

---

## Hook: usePermissions

### Implementación

```typescript
// frontend/src/hooks/usePermissions.ts
import { useAuthStore } from "@/store/authStore";

export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);
  
  const permissions = user?.permissions || [];
  const isAdmin = permissions.includes("*");
  
  /**
   * Verifica si el usuario tiene un permiso específico
   * @param permission - Formato "resource:action" (ej: "expedientes:delete")
   */
  const can = (permission: string): boolean => {
    if (isAdmin) return true;
    return permissions.includes(permission);
  };
  
  /**
   * Verifica si tiene TODOS los permisos
   */
  const canAll = (requiredPermissions: string[]): boolean => {
    if (isAdmin) return true;
    return requiredPermissions.every((p) => permissions.includes(p));
  };
  
  /**
   * Verifica si tiene AL MENOS UNO de los permisos
   */
  const canAny = (requiredPermissions: string[]): boolean => {
    if (isAdmin) return true;
    return requiredPermissions.some((p) => permissions.includes(p));
  };
  
  return {
    can,
    canAll,
    canAny,
    isAdmin,
    permissions,
  };
};
```

### Uso Básico

```tsx
import { usePermissions } from "@/hooks/usePermissions";

function ExpedienteActions({ expedienteId }: Props) {
  const { can, isAdmin } = usePermissions();
  
  return (
    <div className="flex gap-2">
      {can("expedientes:update") && (
        <Button onClick={handleEdit}>Editar</Button>
      )}
      
      {can("expedientes:delete") && (
        <Button variant="destructive" onClick={handleDelete}>
          Eliminar
        </Button>
      )}
      
      {isAdmin && (
        <Button onClick={handleRestoreDeleted}>
          Restaurar Eliminados
        </Button>
      )}
    </div>
  );
}
```

---

## Componentes Condicionales

### Wrapper: Can

Componente reutilizable para renderizado condicional:

```tsx
// frontend/src/components/rbac/Can.tsx
import { usePermissions } from "@/hooks/usePermissions";

interface CanProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const Can = ({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: CanProps) => {
  const { can, canAll, canAny } = usePermissions();
  
  let hasPermission = false;
  
  if (permission) {
    hasPermission = can(permission);
  } else if (permissions) {
    hasPermission = requireAll ? canAll(permissions) : canAny(permissions);
  }
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};
```

**Uso:**

```tsx
import { Can } from "@/components/rbac/Can";

function ExpedienteCard({ expediente }: Props) {
  return (
    <Card>
      <CardHeader>{expediente.nombre}</CardHeader>
      
      <CardFooter>
        {/* Solo si tiene permiso de editar */}
        <Can permission="expedientes:update">
          <Button>Editar</Button>
        </Can>
        
        {/* Solo si tiene AMBOS permisos */}
        <Can permissions={["consultas:create", "consultas:assign"]} requireAll>
          <Button>Nueva Consulta</Button>
        </Can>
        
        {/* Con fallback */}
        <Can 
          permission="expedientes:delete"
          fallback={<span className="txt-muted">Sin permisos</span>}
        >
          <Button variant="destructive">Eliminar</Button>
        </Can>
      </CardFooter>
    </Card>
  );
}
```

---

## Rutas Protegidas

### ProtectedRoute Component

```tsx
// frontend/src/routes/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { usePermissions } from "@/hooks/usePermissions";

interface ProtectedRouteProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute = ({
  permission,
  permissions,
  requireAll = false,
  redirectTo = "/dashboard",
}: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { can, canAll, canAny } = usePermissions();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Si no se especifica permiso, solo verifica autenticación
  if (!permission && !permissions) {
    return <Outlet />;
  }
  
  let hasPermission = false;
  
  if (permission) {
    hasPermission = can(permission);
  } else if (permissions) {
    hasPermission = requireAll ? canAll(permissions) : canAny(permissions);
  }
  
  return hasPermission ? <Outlet /> : <Navigate to={redirectTo} replace />;
};
```

### Configuración de Rutas

```tsx
// frontend/src/routes/index.tsx
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // Ruta pública
      { path: "/login", element: <LoginPage /> },
      
      // Ruta protegida (solo autenticación)
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
        ],
      },
      
      // Ruta con permiso específico
      {
        element: <ProtectedRoute permission="expedientes:read" />,
        children: [
          { path: "/expedientes", element: <ExpedientesListPage /> },
        ],
      },
      
      // Ruta con múltiples permisos (requiere TODOS)
      {
        element: (
          <ProtectedRoute 
            permissions={["usuarios:read", "usuarios:update"]}
            requireAll
          />
        ),
        children: [
          { path: "/usuarios/:id/edit", element: <UserEditPage /> },
        ],
      },
      
      // Ruta con múltiples permisos (requiere AL MENOS UNO)
      {
        element: (
          <ProtectedRoute 
            permissions={["reportes:generate", "reportes:view"]}
            requireAll={false}
          />
        ),
        children: [
          { path: "/reportes", element: <ReportesPage /> },
        ],
      },
      
      // Ruta solo para admin
      {
        element: <ProtectedRoute permission="*" redirectTo="/dashboard" />,
        children: [
          { path: "/admin", element: <AdminPanel /> },
        ],
      },
    ],
  },
]);
```

---

## Botones y Acciones

### Deshabilitar vs Ocultar

**Opción 1: Ocultar completamente**

```tsx
const { can } = usePermissions();

<div className="flex gap-2">
  {can("expedientes:update") && (
    <Button onClick={handleEdit}>Editar</Button>
  )}
  
  {can("expedientes:delete") && (
    <Button variant="destructive" onClick={handleDelete}>
      Eliminar
    </Button>
  )}
</div>
```

**Opción 2: Deshabilitar con tooltip**

```tsx
import { Tooltip } from "@/components/ui/tooltip";

const { can } = usePermissions();

<Tooltip 
  content={!can("expedientes:delete") ? "Sin permisos" : undefined}
>
  <Button 
    variant="destructive" 
    disabled={!can("expedientes:delete")}
    onClick={handleDelete}
  >
    Eliminar
  </Button>
</Tooltip>
```

**Cuándo usar cada uno:**
- **Ocultar:** Cuando la acción no tiene sentido para el usuario (ej: admin panel)
- **Deshabilitar:** Cuando el usuario debe saber que existe pero no tiene acceso (ej: editar expediente asignado a otro médico)

---

## Menús y Navegación

### Sidebar con permisos

```tsx
// frontend/src/components/layouts/Sidebar.tsx
import { usePermissions } from "@/hooks/usePermissions";
import { NavLink } from "react-router-dom";

export const Sidebar = () => {
  const { can, isAdmin } = usePermissions();
  
  const menuItems = [
    {
      label: "Dashboard",
      to: "/dashboard",
      icon: <Home />,
      permission: null, // Todos pueden acceder
    },
    {
      label: "Expedientes",
      to: "/expedientes",
      icon: <FileText />,
      permission: "expedientes:read",
    },
    {
      label: "Usuarios",
      to: "/usuarios",
      icon: <Users />,
      permission: "usuarios:read",
    },
    {
      label: "Reportes",
      to: "/reportes",
      icon: <BarChart />,
      permissions: ["reportes:generate", "reportes:view"], // AL MENOS UNO
    },
    {
      label: "Admin",
      to: "/admin",
      icon: <Settings />,
      permission: "*", // Solo admin
    },
  ];
  
  return (
    <aside className="bg-paper border-r border-line-struct">
      <nav>
        {menuItems.map((item) => {
          // Verificar permisos
          if (item.permission && !can(item.permission)) return null;
          if (item.permissions && !canAny(item.permissions)) return null;
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-2",
                  isActive && "bg-brand text-txt-inverse"
                )
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
```

---

## Tablas con Acciones Condicionales

```tsx
import { usePermissions } from "@/hooks/usePermissions";
import { DropdownMenu } from "@/components/ui/dropdown-menu";

interface ExpedienteRow {
  id: number;
  nombre: string;
  // ...
}

function ExpedientesTable({ expedientes }: { expedientes: ExpedienteRow[] }) {
  const { can } = usePermissions();
  
  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Nombre", accessor: "nombre" },
    {
      header: "Acciones",
      accessor: "actions",
      cell: (row: ExpedienteRow) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent>
            {/* Siempre visible (permiso de lectura implícito) */}
            <DropdownMenuItem onClick={() => navigate(`/expedientes/${row.id}`)}>
              Ver detalles
            </DropdownMenuItem>
            
            {/* Condicional: Solo si puede editar */}
            {can("expedientes:update") && (
              <DropdownMenuItem onClick={() => handleEdit(row.id)}>
                Editar
              </DropdownMenuItem>
            )}
            
            {/* Condicional: Solo si puede eliminar */}
            {can("expedientes:delete") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-status-critical"
                  onClick={() => handleDelete(row.id)}
                >
                  Eliminar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
  
  return <DataTable columns={columns} data={expedientes} />;
}
```

---

## Formularios con Campos Condicionales

```tsx
import { useForm } from "react-hook-form";
import { usePermissions } from "@/hooks/usePermissions";

function ExpedienteForm({ expediente }: Props) {
  const { can } = usePermissions();
  const { register, handleSubmit } = useForm();
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Campo siempre visible */}
      <FormField
        label="Nombre"
        {...register("nombre")}
      />
      
      {/* Campo solo para médicos */}
      {can("consultas:prescribe") && (
        <FormField
          label="Medicamentos Prescritos"
          {...register("medicamentos")}
        />
      )}
      
      {/* Campo solo para admin */}
      {can("*") && (
        <FormField
          label="Notas Internas"
          helperText="Solo visible para administradores"
          {...register("notas_internas")}
        />
      )}
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        
        <Button 
          type="submit" 
          disabled={!can("expedientes:update")}
        >
          Guardar
        </Button>
      </div>
    </form>
  );
}
```

---

## TanStack Query con Permisos

### Queries condicionales

```tsx
import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/usePermissions";
import { expedientesAPI } from "@api/resources/expedientes.api";

function ExpedientesPage() {
  const { can } = usePermissions();
  
  // Solo hacer query si tiene permiso
  const { data, isLoading } = useQuery({
    queryKey: ["expedientes"],
    queryFn: expedientesAPI.getAll,
    enabled: can("expedientes:read"), // Query condicional
  });
  
  if (!can("expedientes:read")) {
    return <ErrorPage message="Sin permisos para ver expedientes" />;
  }
  
  if (isLoading) return <LoadingSpinner />;
  
  return <ExpedientesTable expedientes={data} />;
}
```

### Mutations condicionales

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

function ExpedienteActions({ expedienteId }: Props) {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: () => expedientesAPI.delete(expedienteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expedientes"] });
      toast.success("Expediente eliminado");
    },
    onError: (error: ApiError) => {
      toast.error(error.message);
    },
  });
  
  const handleDelete = () => {
    if (!can("expedientes:delete")) {
      toast.error("No tienes permisos para eliminar expedientes");
      return;
    }
    
    deleteMutation.mutate();
  };
  
  return (
    <Button 
      variant="destructive"
      onClick={handleDelete}
      disabled={!can("expedientes:delete") || deleteMutation.isPending}
    >
      {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
    </Button>
  );
}
```

---

## Permisos Dinámicos (Resource-Level)

### Verificar permiso sobre recurso específico

```tsx
// Ejemplo: Solo el médico asignado puede editar una consulta
function ConsultaEditPage({ consultaId }: Props) {
  const { can } = usePermissions();
  const user = useAuthStore((state) => state.user);
  
  const { data: consulta, isLoading } = useQuery({
    queryKey: ["consultas", consultaId],
    queryFn: () => consultasAPI.getById(consultaId),
  });
  
  if (isLoading) return <LoadingSpinner />;
  
  const isOwner = consulta.medico_id === user.id_usuario;
  const canEdit = can("consultas:update") && (isOwner || can("*"));
  
  if (!canEdit) {
    return (
      <ErrorPage 
        message="Solo el médico asignado puede editar esta consulta" 
      />
    );
  }
  
  return <ConsultaForm consulta={consulta} />;
}
```

---

## Testing con Permisos

### Mock de usePermissions

```tsx
// frontend/src/__tests__/mocks/usePermissions.mock.ts
import { vi } from "vitest";

export const mockUsePermissions = (permissions: string[] = []) => {
  vi.mock("@/hooks/usePermissions", () => ({
    usePermissions: () => ({
      can: (permission: string) => permissions.includes(permission) || permissions.includes("*"),
      canAll: (required: string[]) => required.every((p) => permissions.includes(p)),
      canAny: (required: string[]) => required.some((p) => permissions.includes(p)),
      isAdmin: permissions.includes("*"),
      permissions,
    }),
  }));
};
```

### Test de componente

```tsx
import { render, screen } from "@testing-library/react";
import { mockUsePermissions } from "@/__tests__/mocks/usePermissions.mock";
import { ExpedienteActions } from "./ExpedienteActions";

describe("ExpedienteActions", () => {
  it("muestra botón editar si tiene permiso", () => {
    mockUsePermissions(["expedientes:update"]);
    
    render(<ExpedienteActions expedienteId={1} />);
    
    expect(screen.getByText("Editar")).toBeInTheDocument();
  });
  
  it("oculta botón eliminar si NO tiene permiso", () => {
    mockUsePermissions(["expedientes:read"]); // Sin delete
    
    render(<ExpedienteActions expedienteId={1} />);
    
    expect(screen.queryByText("Eliminar")).not.toBeInTheDocument();
  });
  
  it("muestra todo si es admin", () => {
    mockUsePermissions(["*"]);
    
    render(<ExpedienteActions expedienteId={1} />);
    
    expect(screen.getByText("Editar")).toBeInTheDocument();
    expect(screen.getByText("Eliminar")).toBeInTheDocument();
  });
});
```

---

## Checklist de Implementación

Cuando agregás una nueva feature protegida por permisos:

### Backend
- [ ] Definir permisos en `backend/seeds/permissions.sql` (ej: `expedientes:create`)
- [ ] Agregar decorador `@requires_permission("expedientes:create")` en endpoint
- [ ] Agregar permiso al rol en `backend/seeds/role_permissions.sql`

### Frontend
- [ ] Agregar tipo TypeScript en `types/permissions.types.ts`
- [ ] Proteger ruta con `<ProtectedRoute permission="expedientes:create" />`
- [ ] Condicionar botón/acción con `can("expedientes:create")`
- [ ] Ocultar/deshabilitar UI según permiso
- [ ] Testear con usuario sin permiso

---

## Errores Comunes

### ❌ Verificar permiso solo en frontend

```tsx
// ❌ INSEGURO
const { can } = usePermissions();
if (can("expedientes:delete")) {
  await expedientesAPI.delete(id); // Backend puede rechazar igual
}
```

```tsx
// ✅ CORRECTO (verificar en ambos lados)
const { can } = usePermissions();

if (!can("expedientes:delete")) {
  toast.error("Sin permisos");
  return; // Frontend previene acción innecesaria
}

try {
  await expedientesAPI.delete(id); // Backend valida de nuevo
  toast.success("Eliminado");
} catch (error) {
  // Backend puede rechazar por otras razones
  toast.error(error.message);
}
```

### ❌ Hardcodear permisos

```tsx
// ❌ MAL
if (user.roles.includes("ADMIN")) {
  // ...
}
```

```tsx
// ✅ BIEN
const { isAdmin } = usePermissions();
if (isAdmin) {
  // ...
}
```

### ❌ No manejar estado de carga

```tsx
// ❌ MAL (user puede ser null al inicio)
const { can } = usePermissions();
if (can("expedientes:read")) {
  // ...
}
```

```tsx
// ✅ BIEN
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
const { can } = usePermissions();

if (!isAuthenticated) return <LoadingSpinner />;

if (can("expedientes:read")) {
  // ...
}
```

---

## Referencias

- **Arquitectura RBAC completa:** [docs/architecture/rbac.md](../architecture/rbac.md)
- **Backend permissions:** `backend/src/infrastructure/decorators/requires_permission.py`
- **Auth store:** `frontend/src/store/authStore.ts`

---

**Última actualización:** Enero 2026
