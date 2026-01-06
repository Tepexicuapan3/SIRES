import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionsList } from "./PermissionsList";
import { PermissionForm } from "./PermissionForm";
import { usePermissions } from "@features/admin/hooks";
import type { PermissionResponse } from "@api/types/permissions.types";

/**
 * PermissionsPage - Orquestador principal de gestión de permisos
 *
 * ARQUITECTURA:
 * - State Machine con 3 modos: list | create | edit
 * - Container/Presenter: Este componente orquesta, los hijos renderizan
 *
 * FLUJO DE NAVEGACIÓN:
 * list → create → (success) → list
 * list → edit → (success) → list
 *
 * HOOKS USADOS:
 * - usePermissions(): TanStack Query para listar permisos con cache
 *
 * SEGURIDAD:
 * - Solo accesible con rol ADMIN o permiso permissions:update
 * - Validación en RoleGuard (Routes.tsx)
 */

type ViewMode = "list" | "create" | "edit";

export function PermissionsPage() {
  // Estado de navegación (State Machine)
  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedPermission, setSelectedPermission] =
    useState<PermissionResponse | null>(null);

  // TanStack Query - Cache automático con stale time de 5 minutos
  const { data: permissions = [], isLoading, error } = usePermissions();

  // ============================================================
  // NAVEGACIÓN (State Transitions)
  // ============================================================

  /**
   * Transición: list → create
   */
  const handleCreate = () => {
    setSelectedPermission(null);
    setMode("create");
  };

  /**
   * Transición: list → edit
   * @param permission - Permiso a editar (viene de PermissionsList)
   */
  const handleEdit = (permission: PermissionResponse) => {
    setSelectedPermission(permission);
    setMode("edit");
  };

  /**
   * Transición: create/edit → list
   * Se ejecuta después de submit exitoso o cancelación
   */
  const handleBackToList = () => {
    setSelectedPermission(null);
    setMode("list");
  };

  // ============================================================
  // RENDER CONDICIONAL (State Machine Output)
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Header con navegación contextual */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Botón "Volver" solo visible en modos create/edit */}
          {mode !== "list" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToList}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a la lista
            </Button>
          )}

          {/* Título dinámico basado en modo */}
          <div>
            <h1 className="text-3xl font-bold text-txt-body">
              {mode === "list" && "Permisos del Sistema"}
              {mode === "create" && "Crear Permiso"}
              {mode === "edit" && "Editar Permiso"}
            </h1>
            <p className="text-txt-muted mt-1">
              {mode === "list" && "Gestiona permisos granulares del sistema"}
              {mode === "create" && "Define un nuevo permiso de recurso:acción"}
              {mode === "edit" &&
                "Modifica la descripción y categoría del permiso"}
            </p>
          </div>
        </div>

        {/* Botón "Crear" solo visible en modo list */}
        {mode === "list" && (
          <Button
            onClick={handleCreate}
            className="gap-2 bg-brand hover:bg-brand-hover"
          >
            <Plus className="h-4 w-4" />
            Crear Permiso
          </Button>
        )}
      </div>

      {/* Vista condicional según modo */}
      {mode === "list" && (
        <PermissionsList
          permissions={permissions}
          isLoading={isLoading}
          error={error}
          onEdit={handleEdit}
        />
      )}

      {mode === "create" && (
        <div className="bg-white rounded-lg shadow-sm border border-line-struct p-6">
          <PermissionForm
            mode="create"
            onSuccess={handleBackToList}
            onCancel={handleBackToList}
          />
        </div>
      )}

      {mode === "edit" && selectedPermission && (
        <div className="bg-white rounded-lg shadow-sm border border-line-struct p-6">
          <PermissionForm
            mode="edit"
            permission={selectedPermission}
            onSuccess={handleBackToList}
            onCancel={handleBackToList}
          />
        </div>
      )}
    </div>
  );
}
