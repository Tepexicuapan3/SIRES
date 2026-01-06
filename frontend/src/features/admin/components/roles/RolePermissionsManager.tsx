/**
 * RolePermissionsManager - Gestión de permisos de un rol
 *
 * Permite:
 * - Ver permisos asignados al rol
 * - Asignar múltiples permisos (bulk)
 * - Revocar permisos individuales
 * - Filtrar permisos por categoría
 */

import { useState, useMemo } from "react";
import { Shield, Plus, Trash2, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useRole,
  usePermissionsCatalog,
  useAssignPermissions,
  useRevokePermission,
} from "@/features/admin/hooks";
import { toast } from "sonner";

interface RolePermissionsManagerProps {
  roleId: number;
}

export const RolePermissionsManager = ({
  roleId,
}: RolePermissionsManagerProps) => {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const { data: roleData, isLoading: isLoadingRole } = useRole(roleId);
  const { data: catalogData, isLoading: isLoadingCatalog } =
    usePermissionsCatalog();
  const assignPermissionsMutation = useAssignPermissions();
  const revokePermissionMutation = useRevokePermission(roleId);

  // Permisos ya asignados al rol
  const assignedPermissions = roleData?.permissions || [];
  const assignedPermissionIds = new Set(
    assignedPermissions.map((p) => p.id_permission),
  );

  // Permisos disponibles para asignar (los que NO tiene el rol)
  const availablePermissions = useMemo(() => {
    if (!catalogData?.permissions) return [];
    return catalogData.permissions.filter(
      (p) => !assignedPermissionIds.has(p.id_permission),
    );
  }, [catalogData, assignedPermissionIds]);

  // Filtrar por categoría
  const filteredAvailable = useMemo(() => {
    if (selectedCategory === "all") return availablePermissions;
    return availablePermissions.filter((p) => p.category === selectedCategory);
  }, [availablePermissions, selectedCategory]);

  // Categorías únicas
  const categories = useMemo(() => {
    if (!catalogData?.permissions) return [];
    const cats = new Set(catalogData.permissions.map((p) => p.category));
    return Array.from(cats).sort();
  }, [catalogData]);

  const handleTogglePermission = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  const handleAssignPermissions = async () => {
    if (selectedPermissions.length === 0) {
      toast.error("Selecciona al menos un permiso");
      return;
    }

    try {
      await assignPermissionsMutation.mutateAsync({
        role_id: roleId,
        permission_ids: selectedPermissions,
      });
      toast.success(
        `${selectedPermissions.length} permiso(s) asignado(s) correctamente`,
      );
      setSelectedPermissions([]);
      setIsAssignDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al asignar permisos");
    }
  };

  const handleRevokePermission = async (permissionId: number) => {
    try {
      await revokePermissionMutation.mutateAsync(permissionId);
      toast.success("Permiso revocado correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al revocar permiso");
    }
  };

  if (isLoadingRole) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-txt-muted">Cargando permisos del rol...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand" />
              Permisos Asignados
            </CardTitle>
            <CardDescription>
              Gestiona los permisos del rol {roleData?.role.nom_rol}
            </CardDescription>
          </div>
          <Dialog
            open={isAssignDialogOpen}
            onOpenChange={setIsAssignDialogOpen}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="bg-brand hover:bg-brand-hover">
                <Plus className="mr-2 h-4 w-4" />
                Asignar Permisos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Asignar Permisos al Rol</DialogTitle>
                <DialogDescription>
                  Selecciona los permisos que deseas agregar al rol
                </DialogDescription>
              </DialogHeader>

              {/* Filtro por categoría */}
              <div className="mb-4">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lista de permisos disponibles */}
              <div className="space-y-2">
                {isLoadingCatalog ? (
                  <p className="text-center text-txt-muted">
                    Cargando permisos...
                  </p>
                ) : filteredAvailable.length === 0 ? (
                  <p className="text-center text-txt-muted">
                    {selectedCategory === "all"
                      ? "Todos los permisos ya están asignados"
                      : "No hay permisos disponibles en esta categoría"}
                  </p>
                ) : (
                  filteredAvailable.map((permission) => (
                    <div
                      key={permission.id_permission}
                      className="flex items-center space-x-3 rounded-lg border border-line-struct p-3 hover:bg-subtle"
                    >
                      <Checkbox
                        checked={selectedPermissions.includes(
                          permission.id_permission,
                        )}
                        onCheckedChange={() =>
                          handleTogglePermission(permission.id_permission)
                        }
                        id={`perm-${permission.id_permission}`}
                      />
                      <label
                        htmlFor={`perm-${permission.id_permission}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <code className="text-sm font-medium text-txt-body">
                              {permission.code}
                            </code>
                            <p className="text-xs text-txt-muted">
                              {permission.description}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {permission.category}
                          </Badge>
                        </div>
                      </label>
                    </div>
                  ))
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAssignDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAssignPermissions}
                  disabled={
                    selectedPermissions.length === 0 ||
                    assignPermissionsMutation.isPending
                  }
                  className="bg-brand hover:bg-brand-hover"
                >
                  {assignPermissionsMutation.isPending
                    ? "Asignando..."
                    : `Asignar ${selectedPermissions.length} permiso(s)`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {assignedPermissions.length === 0 ? (
          <div className="py-12 text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-txt-muted" />
            <p className="text-txt-muted">
              Este rol no tiene permisos asignados
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignedPermissions.map((permission) => (
              <div
                key={permission.id_permission}
                className="flex items-center justify-between rounded-lg border border-line-struct p-3 hover:bg-subtle"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-status-stable" />
                    <code className="text-sm font-medium text-txt-body">
                      {permission.code}
                    </code>
                    <Badge variant="outline">{permission.category}</Badge>
                  </div>
                  <p className="ml-6 text-xs text-txt-muted">
                    {permission.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleRevokePermission(permission.id_permission)
                  }
                  disabled={revokePermissionMutation.isPending}
                  className="text-status-critical hover:text-status-critical"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
