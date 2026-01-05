# Agregar una Feature Nueva

Guía paso a paso para implementar una feature completa (backend + frontend).

---

## Ejemplo: Feature "Expedientes"

Vamos a crear un módulo para listar, crear y ver expedientes médicos.

**Permisos necesarios:**
- `expedientes:read`
- `expedientes:create`

---

## Checklist (Copy/Paste)

### Backend
- [ ] Crear use case en `backend/src/use_cases/expedientes/`
- [ ] Crear repository en `backend/src/infrastructure/repositories/`
- [ ] Crear blueprint en `backend/src/presentation/api/`
- [ ] Registrar blueprint en `backend/src/__init__.py`
- [ ] Proteger endpoints con decoradores RBAC

### Frontend
- [ ] Crear types en `frontend/src/api/types/`
- [ ] Crear API resource en `frontend/src/api/resources/`
- [ ] Crear feature folder en `frontend/src/features/expedientes/`
- [ ] Crear hooks (TanStack Query)
- [ ] Crear componentes (pages + forms)
- [ ] Registrar rutas en `frontend/src/routes/Routes.tsx`
- [ ] Proteger con `<ProtectedRoute>`

---

## Backend: Paso a Paso

### 1. Crear Repository

**Archivo:** `backend/src/infrastructure/repositories/expediente_repository.py`

```python
from src.infrastructure.database.mysql_connection import get_db_connection, close_db

class ExpedienteRepository:
    def list(self, page: int = 1, page_size: int = 20):
        """Lista expedientes paginados"""
        offset = (page - 1) * page_size
        
        conn = get_db_connection()
        if not conn:
            raise RuntimeError("DB_CONNECTION_FAILED")
        
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT id_expediente, folio, fecha_alta, estado
                FROM expedientes
                WHERE est_expediente = 'A'
                ORDER BY fecha_alta DESC
                LIMIT %s OFFSET %s
            """, (page_size, offset))
            
            return cursor.fetchall()
        finally:
            close_db(conn, cursor)
    
    def get_by_id(self, id_expediente: int):
        """Obtiene expediente por ID"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute("""
                SELECT * FROM expedientes
                WHERE id_expediente = %s AND est_expediente = 'A'
            """, (id_expediente,))
            
            return cursor.fetchone()
        finally:
            close_db(conn, cursor)
    
    def create(self, folio: str, created_by: str):
        """Crea nuevo expediente"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO expedientes 
                (folio, fecha_alta, est_expediente, usr_alta)
                VALUES (%s, NOW(), 'A', %s)
            """, (folio, created_by))
            
            conn.commit()
            return cursor.lastrowid
        finally:
            close_db(conn, cursor)
```

**Reglas:**
- Solo queries SQL (nada de lógica de negocio)
- Siempre usar queries parametrizadas (`%s`)
- Cerrar cursor y conexión en `finally`

---

### 2. Crear Use Case

**Archivo:** `backend/src/use_cases/expedientes/list_expedientes_usecase.py`

```python
from src.infrastructure.repositories.expediente_repository import ExpedienteRepository

class ListExpedientesUseCase:
    def __init__(self):
        self.repo = ExpedienteRepository()
    
    def execute(self, page: int, page_size: int):
        """Lista expedientes con validación"""
        # Validar paginación
        if page <= 0 or page_size <= 0 or page_size > 200:
            return None, "INVALID_PAGINATION"
        
        try:
            items = self.repo.list(page, page_size)
            
            return {
                "items": items,
                "page": page,
                "page_size": page_size,
            }, None
        except Exception as e:
            print(f"Error listing expedientes: {e}")
            return None, "SERVER_ERROR"
```

**Reglas:**
- Retornar `(result, error_code)`
- No importar Flask (`request`, `jsonify`, etc.)
- Manejar errores con try/except
- Validar input antes de llamar al repo

---

### 3. Crear Blueprint (Routes)

**Archivo:** `backend/src/presentation/api/expedientes_routes.py`

```python
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.infrastructure.authorization.decorators import requires_permission
from src.use_cases.expedientes.list_expedientes_usecase import ListExpedientesUseCase

expedientes_bp = Blueprint("expedientes", __name__)
list_usecase = ListExpedientesUseCase()

# Mapping de errores
ERROR_MAPPING = {
    "INVALID_PAGINATION": (400, "Parámetros de paginación inválidos"),
    "SERVER_ERROR": (500, "Error interno del servidor"),
}

@expedientes_bp.route("/", methods=["GET"])
@jwt_required()
@requires_permission("expedientes:read")
def list_expedientes():
    """GET /api/v1/expedientes?page=1&page_size=20"""
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 20))
    
    result, error = list_usecase.execute(page, page_size)
    
    if error:
        status, msg = ERROR_MAPPING.get(error, (500, "Error desconocido"))
        return jsonify({"code": error, "message": msg}), status
    
    return jsonify(result), 200

@expedientes_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
@requires_permission("expedientes:read")
def get_expediente(id):
    """GET /api/v1/expedientes/123"""
    # Implementación similar
    pass

@expedientes_bp.route("/", methods=["POST"])
@jwt_required()
@requires_permission("expedientes:create")
def create_expediente():
    """POST /api/v1/expedientes"""
    data = request.get_json()
    folio = data.get("folio")
    current_user = get_jwt_identity()
    
    # Implementación con CreateExpedienteUseCase
    pass
```

**Reglas:**
- Usar `@jwt_required()` para endpoints protegidos
- Usar `@requires_permission()` para RBAC
- Mapear `error_code` → HTTP status
- Validar campos required antes de llamar use case

---

### 4. Registrar Blueprint

**Archivo:** `backend/src/__init__.py`

```python
from src.presentation.api.expedientes_routes import expedientes_bp

def create_app():
    app = Flask(__name__)
    # ... config ...
    
    # Registrar blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(expedientes_bp, url_prefix="/api/v1/expedientes")
    
    return app
```

---

## Frontend: Paso a Paso

### 1. Crear Types

**Archivo:** `frontend/src/api/types/expedientes.types.ts`

```ts
export interface Expediente {
  id_expediente: number;
  folio: string;
  fecha_alta: string;
  estado: string;
}

export interface ListExpedientesResponse {
  items: Expediente[];
  page: number;
  page_size: number;
}

export interface CreateExpedienteRequest {
  folio: string;
}
```

---

### 2. Crear API Resource

**Archivo:** `frontend/src/api/resources/expedientes.api.ts`

```ts
import apiClient from "@api/client";
import type { ListExpedientesResponse, CreateExpedienteRequest } from "@api/types/expedientes.types";

export const expedientesAPI = {
  list: async (page = 1, pageSize = 20): Promise<ListExpedientesResponse> => {
    const res = await apiClient.get<ListExpedientesResponse>("/expedientes", {
      params: { page, page_size: pageSize },
    });
    return res.data;
  },

  getById: async (id: number) => {
    const res = await apiClient.get(`/expedientes/${id}`);
    return res.data;
  },

  create: async (data: CreateExpedienteRequest) => {
    const res = await apiClient.post("/expedientes", data);
    return res.data;
  },
};
```

**Reglas:**
- Usar `apiClient` (con interceptors de CSRF + refresh)
- Tipar requests y responses
- No manejar errores acá (se hace en hooks)

---

### 3. Crear Hooks (TanStack Query)

**Archivo:** `frontend/src/features/expedientes/hooks/useExpedientes.ts`

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { expedientesAPI } from "@api/resources/expedientes.api";

// Query keys (para cache)
export const expedientesKeys = {
  all: ["expedientes"] as const,
  list: (page: number, pageSize: number) => 
    [...expedientesKeys.all, "list", page, pageSize] as const,
  detail: (id: number) => 
    [...expedientesKeys.all, "detail", id] as const,
};

// Hook para listar
export const useExpedientes = (page: number, pageSize: number) => {
  return useQuery({
    queryKey: expedientesKeys.list(page, pageSize),
    queryFn: () => expedientesAPI.list(page, pageSize),
    staleTime: 1000 * 60 * 5, // Cache por 5min
  });
};

// Hook para crear
export const useCreateExpediente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expedientesAPI.create,
    onSuccess: () => {
      // Invalidar cache para refrescar lista
      queryClient.invalidateQueries({ queryKey: expedientesKeys.all });
      toast.success("Expediente creado correctamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear expediente");
    },
  });
};
```

**Reglas:**
- Centralizar query keys (evita typos)
- Invalidar cache en mutaciones exitosas
- Mostrar toasts para feedback

---

### 4. Crear Page Component

**Archivo:** `frontend/src/features/expedientes/components/ExpedientesPage.tsx`

```tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useExpedientes } from "@features/expedientes/hooks/useExpedientes";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function ExpedientesPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useExpedientes(page, pageSize);

  if (isLoading) return <div>Cargando expedientes...</div>;
  if (error) return <div>Error al cargar expedientes</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold txt-body">Expedientes</h1>
        
        <PermissionGate permission="expedientes:create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Expediente
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b border-line-struct">
              <th className="text-left p-4">Folio</th>
              <th className="text-left p-4">Fecha Alta</th>
              <th className="text-left p-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((exp) => (
              <tr key={exp.id_expediente} className="border-b border-line-hairline hover:bg-subtle">
                <td className="p-4">{exp.folio}</td>
                <td className="p-4">{new Date(exp.fecha_alta).toLocaleDateString()}</td>
                <td className="p-4">{exp.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Paginación */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>
          Anterior
        </Button>
        <Button variant="outline" onClick={() => setPage(page + 1)}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}
```

**Reglas:**
- Usar hooks de TanStack Query (no fetch directo)
- Usar `<PermissionGate>` para botones protegidos
- Mostrar estados: loading, error, success
- Usar tokens Metro (bg-subtle, txt-body, line-struct)

---

### 5. Registrar Ruta

**Archivo:** `frontend/src/routes/Routes.tsx`

```tsx
import { lazy } from "react";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

const ExpedientesPage = lazy(() => import("@features/expedientes/components/ExpedientesPage"));

// Dentro de <Routes>
<Route
  path="/expedientes"
  element={
    <ProtectedRoute requiredPermission="expedientes:read">
      <ExpedientesPage />
    </ProtectedRoute>
  }
/>
```

**Reglas:**
- Lazy load para code-splitting
- Proteger con `requiredPermission`
- Si no requiere permiso, usar solo `<ProtectedRoute>` (verifica auth)

---

## Validación con Zod (Forms)

### Crear Formulario con Validación

**Archivo:** `frontend/src/features/expedientes/components/CreateExpedienteForm.tsx`

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { useCreateExpediente } from "@features/expedientes/hooks/useExpedientes";

const schema = z.object({
  folio: z.string()
    .min(1, "El folio es requerido")
    .max(20, "Máximo 20 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function CreateExpedienteForm() {
  const { mutate, isPending } = useCreateExpediente();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        id="folio"
        label="Folio"
        error={errors.folio}
        {...register("folio")}
      />

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creando..." : "Crear Expediente"}
      </Button>
    </form>
  );
}
```

---

## Testing Manual

### 1. Backend

```bash
# Levantar backend
docker-compose up -d backend

# Probar endpoint (con token de admin)
curl -X GET "http://localhost:5000/api/v1/expedientes?page=1&page_size=20" \
  -H "Cookie: access_token_cookie=<jwt>" \
  -H "X-CSRF-TOKEN: <csrf>"
```

### 2. Frontend

```bash
# Levantar frontend
docker-compose up -d frontend

# Abrir navegador
http://localhost:5173/expedientes
```

**Verificar:**
- [ ] Lista de expedientes carga
- [ ] Botón "Nuevo" solo visible si tiene permiso `expedientes:create`
- [ ] Error 403 si no tiene `expedientes:read`
- [ ] Paginación funciona

---

## Troubleshooting

### Error 403 aunque tenga el permiso

**Causa:** Cache de permisos desactualizado.

**Solución:**
```bash
curl -X POST "http://localhost:5000/api/v1/permissions/cache/invalidate" \
  -H "Cookie: access_token_cookie=<admin_token>"
```

### Frontend no muestra datos

**Causa:** Error de CORS o response format incorrecto.

**Solución:**
1. Abrir DevTools → Network
2. Verificar status code
3. Revisar response body

### Hook no invalida cache

**Causa:** Query key distinta en `invalidateQueries`.

**Solución:**
Usar las query keys centralizadas:
```ts
queryClient.invalidateQueries({ queryKey: expedientesKeys.all });
```

---

## Próximos Pasos

1. **UI Components:** Ver `docs/guides/ui-components.md`
2. **Testing:** Ver `docs/guides/testing.md`
3. **RBAC avanzado:** Ver `docs/architecture/rbac.md`

---

**Última actualización:** Enero 2026
