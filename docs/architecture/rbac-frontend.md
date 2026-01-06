# Arquitectura Frontend - Sistema RBAC CRUD

> **TL;DR:** Documentación técnica de la arquitectura frontend del sistema RBAC 2.0. Explica patrones de diseño, estructura de componentes, flujo de datos y decisiones técnicas.

## Contexto y Problema

El frontend del sistema RBAC CRUD necesita gestionar:
- **Múltiples entidades relacionadas:** Roles → Permisos, Usuarios → Roles, Usuarios → Overrides
- **Estado complejo:** Cache de TanStack Query, estado local de UI, navegación entre vistas
- **Validaciones cruzadas:** Reglas de negocio (ej: no revocar último rol)
- **UX consistente:** Metro CDMX design system, loading states, error handling

**Decisión arquitectónica:** Arquitectura modular con Container/Presenter pattern + TanStack Query para estado servidor.

---

## Stack Técnico

```
┌─────────────────────────────────────────────┐
│ React 19 + TypeScript                      │
│ ├─ Vite (build tool)                       │
│ ├─ TanStack Query v5 (server state)        │
│ ├─ Zustand (UI state - mínimo)             │
│ ├─ React Hook Form + Zod (validación)      │
│ ├─ shadcn/ui + Tailwind 4 (UI primitivos)  │
│ └─ Sonner (toast notifications)            │
└─────────────────────────────────────────────┘
```

**Justificación de elecciones:**

- **TanStack Query:** Cache automático, invalidación inteligente, retry, loading states
- **Zod:** Validación type-safe, esquemas reutilizables, errores descriptivos
- **shadcn/ui:** Componentes copiables (no librería), customizables, accesibles
- **Tailwind 4:** Utility-first, Metro CDMX tokens via CSS variables

---

## Estructura de Archivos

```
frontend/src/
├── api/                          # Capa de API (Axios + Types)
│   ├── client.ts                 # Axios instance con interceptors
│   ├── resources/                # API calls por recurso
│   │   ├── roles.api.ts          # 7 funciones CRUD roles
│   │   ├── permissions.api.ts    # 9 funciones CRUD permisos + overrides
│   │   └── users.api.ts          # 4 funciones multi-rol
│   └── types/                    # Contratos TypeScript
│       ├── roles.types.ts        # 12 interfaces roles
│       ├── permissions.types.ts  # 8 interfaces permisos
│       └── users.types.ts        # 6 interfaces usuarios
│
├── features/admin/               # Feature Module: Administración
│   ├── hooks/                    # React Query Hooks (Custom)
│   │   ├── useRoles.ts           # 7 hooks CRUD roles
│   │   ├── useAdminPermissions.ts# 11 hooks CRUD permisos + overrides
│   │   ├── useAdminUsers.ts      # 4 hooks multi-rol
│   │   └── index.ts              # Barrel export
│   │
│   └── components/               # UI Components
│       ├── roles/                # Módulo Roles (988 líneas)
│       │   ├── RolesPage.tsx     # Orquestador (160 líneas)
│       │   ├── RolesList.tsx     # Tabla + acciones (240 líneas)
│       │   ├── RoleForm.tsx      # Crear/Editar (260 líneas)
│       │   ├── RolePermissionsManager.tsx  # Asignar permisos (300 líneas)
│       │   └── index.ts
│       │
│       ├── permissions/          # Módulo Permisos (715 líneas)
│       │   ├── PermissionsPage.tsx      # Orquestador (151 líneas)
│       │   ├── PermissionsList.tsx      # Tabla + filtro (254 líneas)
│       │   ├── PermissionForm.tsx       # Crear/Editar (295 líneas)
│       │   └── index.ts
│       │
│       └── users/                # Módulo Usuarios (1,617 líneas)
│           ├── UsersPage.tsx              # Orquestador (189 líneas)
│           ├── UsersList.tsx              # Tabla + búsqueda (260 líneas)
│           ├── UserRolesManager.tsx       # Multi-rol (518 líneas)
│           ├── UserPermissionOverrides.tsx # Overrides (633 líneas)
│           └── index.ts
│
├── routes/
│   └── Routes.tsx                # React Router config + lazy loading
│
└── styles/
    └── theme.css                 # Metro CDMX design tokens
```

**Principios de organización:**

1. **Feature-based:** Cada módulo (roles, permissions, users) es autónomo
2. **Barrel exports:** Imports limpios via `index.ts`
3. **Colocation:** Hooks cerca de componentes que los usan
4. **Separación API/UI:** Capa API independiente, reutilizable

---

## Patrones de Diseño Aplicados

### 1. Container/Presenter Pattern

**Problema:** Componentes monolíticos difíciles de testear y reutilizar.

**Solución:** Separar lógica de presentación.

**Implementación:**

```tsx
// CONTAINER: RolesPage (lógica, estado, navegación)
export function RolesPage() {
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const { data: roles, isLoading } = useRoles(); // TanStack Query
  
  return mode === "list" 
    ? <RolesList roles={roles} onEdit={handleEdit} />  // Presenter
    : <RoleForm onSuccess={handleBack} />;             // Presenter
}

// PRESENTER: RolesList (solo props, sin lógica de negocio)
export function RolesList({ roles, onEdit }: RolesListProps) {
  return (
    <Table>
      {roles.map(role => (
        <TableRow key={role.id_rol}>
          <Button onClick={() => onEdit(role)}>Editar</Button>
        </TableRow>
      ))}
    </Table>
  );
}
```

**Ventajas:**
- ✅ RolesList es reutilizable (ej: en un modal)
- ✅ Fácil de testear (pasar props mock)
- ✅ Separación de concerns clara

---

### 2. State Machine Pattern

**Problema:** Estado UI complejo con múltiples booleans (`showEdit`, `showCreate`, `showDetail`).

**Solución:** Usar enums y transiciones explícitas.

**Implementación:**

```tsx
type ViewMode = "list" | "create" | "edit" | "detail";

export function RolesPage() {
  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  
  // Transiciones explícitas
  const goToCreate = () => setMode("create");
  const goToEdit = (id: number) => {
    setSelectedRoleId(id);
    setMode("edit");
  };
  const goToList = () => {
    setSelectedRoleId(null);
    setMode("list");
  };
  
  // Render basado en estado
  switch (mode) {
    case "list": return <RolesList />;
    case "create": return <RoleForm mode="create" />;
    case "edit": return <RoleForm mode="edit" roleId={selectedRoleId!} />;
    case "detail": return <RolePermissionsManager roleId={selectedRoleId!} />;
  }
}
```

**Ventajas:**
- ✅ Imposible estar en "create" y "edit" simultáneamente
- ✅ Transiciones explícitas y testeables
- ✅ Fácil agregar nuevos estados (ej: "deleting")

---

### 3. Composite Pattern

**Problema:** Vista de usuario necesita combinar múltiples managers (roles + overrides).

**Solución:** Composición de componentes autónomos.

**Implementación:**

```tsx
export function UsersPage() {
  return mode === "detail" ? (
    <div className="space-y-6">
      {/* Card de info básica */}
      <UserInfoCard user={selectedUser} />
      
      {/* Manager 1: Roles (autónomo) */}
      <UserRolesManager userId={userId} />
      
      {/* Manager 2: Overrides (autónomo) */}
      <UserPermissionOverrides userId={userId} />
    </div>
  ) : (
    <UsersList />
  );
}
```

**Ventajas:**
- ✅ Cada manager es independiente (propio estado, hooks)
- ✅ Se pueden desarrollar/testear por separado
- ✅ Fácil agregar nuevos managers (ej: auditoria)

---

### 4. Custom Hooks Pattern

**Problema:** Lógica de TanStack Query repetida en componentes.

**Solución:** Hooks personalizados que encapsulan queries y mutations.

**Implementación:**

```tsx
// hooks/useRoles.ts
export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.getRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rolesApi.createRole,
    onSuccess: () => {
      // Invalidar cache automáticamente
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol creado correctamente");
    },
  });
}

// Componente (uso simple)
function RoleForm() {
  const createRoleMutation = useCreateRole(); // 🎯 1 línea
  
  const handleSubmit = async (data) => {
    await createRoleMutation.mutateAsync(data);
  };
}
```

**Ventajas:**
- ✅ DRY: lógica centralizada
- ✅ Cache invalidation automática
- ✅ Toast notifications consistentes
- ✅ Tipo seguro (TypeScript infiere tipos)

---

## Flujo de Datos

### Arquitectura en Capas

```
┌─────────────────────────────────────────────┐
│ UI Components (Presenters)                 │ ← React components
│ └─ Props in, callbacks out                 │
├─────────────────────────────────────────────┤
│ Container Components                        │ ← State, navigation
│ └─ useState, TanStack Query hooks          │
├─────────────────────────────────────────────┤
│ Custom Hooks (useRoles, usePermissions)    │ ← Business logic
│ └─ TanStack Query wrappers                 │
├─────────────────────────────────────────────┤
│ API Resources (roles.api.ts)               │ ← HTTP calls
│ └─ Axios instances                         │
├─────────────────────────────────────────────┤
│ Backend (Flask)                             │ ← REST API
└─────────────────────────────────────────────┘
```

### Ejemplo: Crear Rol (Flujo Completo)

```
1. Usuario → RoleForm (presenter)
   ↓ onClick "Crear Rol"
   
2. RoleForm.handleSubmit()
   ↓ await createRoleMutation.mutateAsync(data)
   
3. useCreateRole() (custom hook)
   ↓ mutationFn: rolesApi.createRole
   
4. rolesApi.createRole() (API layer)
   ↓ POST /api/v1/roles con Axios
   
5. Backend Flask
   ↓ CreateRoleUseCase.execute()
   ↓ Retorna { id_rol, nombre, ... }
   
6. useCreateRole().onSuccess
   ↓ queryClient.invalidateQueries(["roles"])
   ↓ toast.success("Rol creado")
   
7. TanStack Query refetch automático
   ↓ useRoles() detecta invalidación
   ↓ Hace GET /api/v1/roles
   
8. RolesList (presenter)
   ↓ Recibe roles actualizados via props
   ↓ Re-renderiza tabla con nuevo rol
```

**Tiempo total:** ~500ms (depende de latencia red)

---

## Gestión de Estado

### Server State (TanStack Query)

**Qué guardamos:**
- Roles (lista completa)
- Permisos (catálogo + asignados a rol)
- Usuarios (lista + roles + overrides)
- Permisos efectivos (consolidados)

**Configuración de cache:**

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutos (datos no cambian frecuentemente)
      gcTime: 10 * 60 * 1000,    // 10 minutos (garbage collection)
      retry: 1,                   // Solo 1 retry (evitar loops)
      refetchOnWindowFocus: true, // Refetch al volver a la pestaña
    },
  },
});
```

**Stale times por recurso:**

| Recurso | Stale Time | Justificación |
|---------|------------|---------------|
| Roles | 5 min | Cambian poco (solo admins) |
| Permisos | 5 min | Catálogo semi-estático |
| User Roles | 2 min | Cambian más frecuentemente |
| User Overrides | 2 min | Temporales, chequeo frecuente |
| Effective Permissions | 1 min | Resultado calculado (cache corto) |

**Invalidación cruzada:**

```tsx
// Ejemplo: Cambiar rol primario invalida permisos efectivos
export function useSetPrimaryRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: usersApi.setPrimaryRole,
    onSuccess: (_, { userId }) => {
      // Invalidar múltiples queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["userRoles", userId] });
      queryClient.invalidateQueries({ queryKey: ["userEffectivePermissions", userId] });
    },
  });
}
```

---

### UI State (useState local)

**Qué guardamos:**
- Modo de vista (list/create/edit/detail)
- ID del recurso seleccionado
- Estado de dialogs (abierto/cerrado)
- Formularios (delegado a React Hook Form)
- Filtros/búsqueda (local, sin server)

**Principio:** Usar estado local SOLO para UI que no necesita persistir.

```tsx
// ✅ Correcto: Estado de dialog (temporal, UI only)
const [showDialog, setShowDialog] = useState(false);

// ❌ Incorrecto: Lista de roles (debe venir de TanStack Query)
const [roles, setRoles] = useState([]); // NO HACER ESTO
```

---

## Validación de Formularios

### Arquitectura Zod + React Hook Form

**Flujo:**

```
1. Definir schema Zod (reutilizable)
   ↓
2. Conectar con React Hook Form
   ↓
3. Validación automática on blur/submit
   ↓
4. Errores type-safe en UI
```

**Ejemplo completo:**

```tsx
// 1. Schema Zod (types/schemas/roleSchema.ts)
export const createRoleSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(50, "Máximo 50 caracteres")
    .regex(/^[A-Z_]+$/, "Solo MAYÚSCULAS y guiones bajos")
    .transform(val => val.toUpperCase()),
  
  descripcion: z.string().optional(),
  
  landing_route: z
    .string()
    .regex(/^\/[a-z-/]*$/, "Debe empezar con /"),
  
  priority: z
    .number()
    .int()
    .min(1, "Mínimo 1")
    .max(999, "Máximo 999"),
  
  is_admin: z.boolean().default(false),
});

export type CreateRoleFormData = z.infer<typeof createRoleSchema>;

// 2. Componente con React Hook Form
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function RoleForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema), // 🎯 Conectar schema
  });
  
  const onSubmit = async (data: CreateRoleFormData) => {
    // data ya está validado y transformado (nombre en MAYÚSCULAS)
    await createRoleMutation.mutateAsync(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register("nombre")}
        placeholder="NOMBRE_ROL"
      />
      {errors.nombre && (
        <p className="text-status-critical">{errors.nombre.message}</p>
      )}
      
      <Input
        type="number"
        {...register("priority", { valueAsNumber: true })}
      />
      {errors.priority && (
        <p className="text-status-critical">{errors.priority.message}</p>
      )}
      
      <Button type="submit">Crear Rol</Button>
    </form>
  );
}
```

**Ventajas:**
- ✅ Type-safe: TypeScript infiere tipos del schema
- ✅ Reutilizable: Mismo schema frontend/backend
- ✅ Transformaciones: `.toUpperCase()` automático
- ✅ Errores descriptivos: Mensajes en español

---

## Manejo de Errores

### Estrategia de 3 Capas

```
1. API Layer (Axios interceptor)
   ↓ Captura errores HTTP, transforma a formato consistente
   
2. Custom Hook (TanStack Query)
   ↓ onError: toast.error() + log
   
3. UI Component
   ↓ Muestra error.message en UI (opcional)
```

**Implementación:**

```tsx
// 1. Axios interceptor (api/client.ts)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || "Error desconocido";
    
    // Error personalizado con código
    throw new ApiError(message, error.response?.status);
  }
);

// 2. Custom hook (hooks/useRoles.ts)
export function useDeleteRole() {
  return useMutation({
    mutationFn: rolesApi.deleteRole,
    onError: (error) => {
      const message = error instanceof ApiError 
        ? error.message 
        : "Error al eliminar rol";
      
      toast.error(message);
      console.error("[useDeleteRole] Error:", error);
    },
  });
}

// 3. Componente (components/RolesList.tsx)
function RolesList() {
  const deleteRoleMutation = useDeleteRole();
  
  const handleDelete = async (roleId: number) => {
    try {
      await deleteRoleMutation.mutateAsync(roleId);
      // ✅ Success ya manejado en hook (toast.success)
    } catch (error) {
      // ✅ Error ya manejado en hook (toast.error)
      // Opcional: UI adicional (ej: deshabilitar botón)
    }
  };
}
```

**Tipos de errores manejados:**

| Error | Código HTTP | Acción |
|-------|-------------|--------|
| Unauthorized | 401 | Redirect a /login + limpiar token |
| Forbidden | 403 | Toast "No autorizado" |
| Not Found | 404 | Toast "Recurso no encontrado" |
| Conflict | 409 | Toast con mensaje específico (ej: "Rol ya existe") |
| Validation | 400 | Mostrar errores en formulario |
| Server Error | 500 | Toast "Error del servidor" + log |

---

## Optimizaciones de Performance

### 1. Lazy Loading de Rutas

**Problema:** Bundle inicial muy grande (~2MB con todos los componentes).

**Solución:** Code splitting con React.lazy().

```tsx
// routes/Routes.tsx
const RolesPage = lazy(() =>
  import("@features/admin/components/roles").then((m) => ({
    default: m.RolesPage,
  }))
);

// Se descarga solo cuando navegas a /admin/roles
```

**Resultado:**
- Bundle inicial: ~400KB
- Chunk de roles: ~150KB (descarga on-demand)

---

### 2. Memoización de Computaciones Pesadas

**Problema:** Cálculo de permisos disponibles en cada render.

**Solución:** useMemo() con dependencias correctas.

```tsx
// UserRolesManager.tsx
const availableRoles = useMemo(() => {
  const assignedIds = new Set(userRoles.map((ur) => ur.id_rol));
  return allRoles.filter((role) => !assignedIds.has(role.id_rol));
}, [allRoles, userRoles]); // Solo recalcula si cambian estos
```

---

### 3. Optimistic Updates (Futuro)

**Concepto:** Actualizar UI antes de recibir respuesta del servidor.

**Implementación (no aplicada aún, pero preparada):**

```tsx
export function useDeleteRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rolesApi.deleteRole,
    onMutate: async (roleId) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: ["roles"] });
      
      // Snapshot del estado anterior
      const previousRoles = queryClient.getQueryData(["roles"]);
      
      // Update optimista
      queryClient.setQueryData(["roles"], (old: Role[]) =>
        old.filter((r) => r.id_rol !== roleId)
      );
      
      return { previousRoles }; // Para rollback
    },
    onError: (_err, _roleId, context) => {
      // Rollback en caso de error
      queryClient.setQueryData(["roles"], context.previousRoles);
    },
  });
}
```

---

## Accesibilidad (a11y)

### WCAG 2.1 AA Compliance

**Implementado:**

1. **Keyboard Navigation:**
   - Todos los botones/links accesibles con Tab
   - Dialogs se pueden cerrar con Esc
   - Forms navegables con Tab/Shift+Tab

2. **ARIA Labels:**
   ```tsx
   <Button
     aria-label="Editar rol ADMIN"
     onClick={() => handleEdit(role)}
   >
     <Edit className="h-4 w-4" />
   </Button>
   ```

3. **Focus States:**
   ```css
   .focus-visible:ring-2 ring-brand /* Tailwind */
   ```

4. **Color Contrast:**
   - Texto: 4.5:1 mínimo (WCAG AA)
   - Metro CDMX brand (#E00034) sobre blanco: 6.2:1 ✅

5. **Screen Readers:**
   - Tablas con `<TableHeader>` semántico
   - Form labels asociados con `htmlFor`
   - Live regions para toasts (Sonner lo hace automático)

---

## Metro CDMX Design System

### Tokens CSS

```css
/* frontend/src/styles/theme.css */
:root {
  /* Marca */
  --metro-orange-500: #E00034;
  --metro-orange-600: #B8002A;
  
  /* Estados */
  --clinical-stable: #28A745;
  --clinical-alert: #FFC107;
  --clinical-critical: #DC3545;
  
  /* Texto */
  --text-body: #212121;
  --text-muted: #6C757D;
  
  /* Bordes */
  --border-struct: #DEE2E6;
  
  /* Fondos */
  --bg-subtle: #F8F9FA;
}
```

### Uso en Componentes

```tsx
// ✅ Correcto: Usar clases Tailwind con tokens
<Button className="bg-brand hover:bg-brand-hover text-white">
  Crear Rol
</Button>

<Badge className="bg-status-stable">Activo</Badge>

// ❌ Incorrecto: Hardcodear colores
<Button className="bg-red-500">  {/* NO */}
```

---

## Testing (Preparado, no implementado)

### Estructura Propuesta

```
frontend/tests/
├── unit/                     # Componentes individuales
│   ├── RoleForm.test.tsx
│   └── PermissionsList.test.tsx
├── integration/              # Flujos completos
│   └── CreateRole.test.tsx
└── e2e/                      # Playwright (futuro)
    └── rbac-workflow.spec.ts
```

### Ejemplo de Test (Propuesto)

```tsx
// tests/unit/RoleForm.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleForm } from "@features/admin/components/roles/RoleForm";

describe("RoleForm", () => {
  it("valida nombre en mayúsculas", async () => {
    render(<RoleForm mode="create" />);
    
    const input = screen.getByLabelText("Nombre");
    await userEvent.type(input, "medico");
    
    await waitFor(() => {
      expect(input).toHaveValue("MEDICO"); // Transform automático
    });
  });
  
  it("muestra error si prioridad < 1", async () => {
    render(<RoleForm mode="create" />);
    
    const priorityInput = screen.getByLabelText("Prioridad");
    await userEvent.type(priorityInput, "0");
    
    const submitButton = screen.getByText("Crear Rol");
    await userEvent.click(submitButton);
    
    expect(screen.getByText("Mínimo 1")).toBeInTheDocument();
  });
});
```

---

## Troubleshooting Técnico

### Problema: "React Hook useQuery is called conditionally"

**Causa:** Llamar hook dentro de if/loop.

```tsx
// ❌ Incorrecto
if (userId) {
  const { data } = useUserRoles(userId);
}

// ✅ Correcto
const { data } = useUserRoles(userId, { enabled: !!userId });
```

---

### Problema: "Query no se invalida después de mutation"

**Causa:** Query key diferente.

```tsx
// ❌ Incorrecto
useQuery({ queryKey: ["roles"] });
invalidateQueries({ queryKey: ["rolesList"] }); // Diferente

// ✅ Correcto
useQuery({ queryKey: ["roles"] });
invalidateQueries({ queryKey: ["roles"] }); // Mismo
```

---

### Problema: "Componente re-renderiza demasiado"

**Causa:** Dependencias incorrectas en useMemo/useCallback.

```tsx
// ❌ Incorrecto (objeto nuevo en cada render)
const availableRoles = allRoles.filter(/* ... */);

// ✅ Correcto (memoizado)
const availableRoles = useMemo(
  () => allRoles.filter(/* ... */),
  [allRoles, userRoles]
);
```

---

## Métricas de Código

| Métrica | Valor | Objetivo |
|---------|-------|----------|
| Componentes totales | 15 | - |
| Líneas de código | 4,809 | <10,000 |
| Hooks custom | 22 | - |
| Test coverage | 0% | >80% (futuro) |
| Bundle size (gzipped) | ~150KB | <200KB |
| Lighthouse Performance | - | >90 (futuro) |
| Lighthouse Accessibility | - | 100 (objetivo) |

---

## Próximos Pasos (Roadmap)

1. **Testing:**
   - Implementar tests unitarios (Vitest)
   - Tests de integración (React Testing Library)
   - E2E con Playwright

2. **Performance:**
   - Optimistic updates
   - Virtual scrolling para listas largas (>100 items)
   - Service Worker para cache offline

3. **UX:**
   - Skeleton loaders en vez de spinners
   - Drag & drop para reordenar prioridades
   - Undo/Redo para operaciones críticas

4. **Accesibilidad:**
   - Auditoría completa con axe-core
   - Soporte completo de screen readers
   - Modo de alto contraste

---

## Referencias

- **Plan de implementación:** `docs/guides/rbac-crud-implementation.md`
- **Guía de uso:** `docs/guides/rbac-crud-user-guide.md`
- **TanStack Query docs:** https://tanstack.com/query/latest
- **shadcn/ui:** https://ui.shadcn.com
- **Metro CDMX design:** `frontend/src/styles/theme.css`
