/**
 * RolesPage - Página principal de gestión de roles
 *
 * Orquesta:
 * - Lista de roles (RolesList)
 * - Creación de roles (RoleForm)
 * - Edición de roles (RoleForm)
 * - Gestión de permisos (RolePermissionsManager)
 */

import { useState } from "react";
import { Shield, Plus, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRoles } from "@/features/admin/hooks";
import { RolesList } from "./RolesList";
import { RoleForm } from "./RoleForm";
import { RolePermissionsManager } from "./RolePermissionsManager";

type ViewMode = "list" | "create" | "edit" | "detail";

export const RolesPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  const { data: roles, isLoading, error } = useRoles();

  const handleViewDetail = (roleId: number) => {
    setSelectedRoleId(roleId);
    setViewMode("detail");
  };

  const handleEdit = (roleId: number) => {
    setSelectedRoleId(roleId);
    setViewMode("edit");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedRoleId(null);
  };

  const handleSuccess = () => {
    handleBackToList();
  };

  // Vista: Lista de roles
  if (viewMode === "list") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-brand" />
                  Gestión de Roles
                </CardTitle>
                <CardDescription>
                  Administra los roles del sistema y sus permisos
                </CardDescription>
              </div>
              <Button
                onClick={() => setViewMode("create")}
                className="bg-brand hover:bg-brand-hover"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Rol
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="rounded-lg border border-status-critical bg-status-critical/10 p-4 text-center">
                <p className="text-status-critical">
                  Error al cargar roles: {(error as Error).message}
                </p>
              </div>
            ) : (
              <RolesList
                roles={roles || []}
                isLoading={isLoading}
                onEdit={handleEdit}
                onViewDetail={handleViewDetail}
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista: Crear rol
  if (viewMode === "create") {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBackToList} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la lista
        </Button>
        <RoleForm onSuccess={handleSuccess} onCancel={handleBackToList} />
      </div>
    );
  }

  // Vista: Editar rol
  if (viewMode === "edit" && selectedRoleId) {
    const selectedRole = roles?.find((r) => r.id_rol === selectedRoleId);

    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBackToList} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la lista
        </Button>
        <RoleForm
          role={selectedRole}
          onSuccess={handleSuccess}
          onCancel={handleBackToList}
        />
      </div>
    );
  }

  // Vista: Detalle del rol (permisos)
  if (viewMode === "detail" && selectedRoleId) {
    const selectedRole = roles?.find((r) => r.id_rol === selectedRoleId);

    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBackToList} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la lista
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand" />
              {selectedRole?.nom_rol}
            </CardTitle>
            <CardDescription>
              Código: {selectedRole?.cod_rol} | Prioridad:{" "}
              {selectedRole?.priority}
            </CardDescription>
          </CardHeader>
        </Card>

        <RolePermissionsManager roleId={selectedRoleId} />
      </div>
    );
  }

  return null;
};
