/**
 * PermissionsList - Lista de permisos con acciones CRUD
 *
 * Muestra permisos agrupados por categoría con:
 * - Code, resource, action, description
 * - Badge de sistema (is_system)
 * - Acciones: Editar, Eliminar
 */

import { useState } from "react";
import { Key, Edit, Trash2, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeletePermission } from "@/features/admin/hooks";
import type { PermissionResponse } from "@/api/types/permissions.types";
import { toast } from "sonner";

interface PermissionsListProps {
  permissions: PermissionResponse[];
  isLoading?: boolean;
  onEdit: (permissionId: number) => void;
}

export const PermissionsList = ({
  permissions,
  isLoading,
  onEdit,
}: PermissionsListProps) => {
  const [permissionToDelete, setPermissionToDelete] = useState<number | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const deletePermissionMutation = useDeletePermission();

  const handleDeleteConfirm = async () => {
    if (!permissionToDelete) return;

    try {
      await deletePermissionMutation.mutateAsync(permissionToDelete);
      toast.success("Permiso eliminado correctamente");
      setPermissionToDelete(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el permiso";
      toast.error(message);
    }
  };

  // Obtener categorías únicas
  const categories = Array.from(
    new Set(permissions.map((p) => p.category)),
  ).sort();

  // Filtrar por categoría
  const filteredPermissions =
    selectedCategory === "all"
      ? permissions
      : permissions.filter((p) => p.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-txt-muted">Cargando permisos...</div>
      </div>
    );
  }

  if (!permissions || permissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Key className="mb-4 h-12 w-12 text-txt-muted" />
        <h3 className="text-lg font-semibold text-txt-body">
          No hay permisos registrados
        </h3>
      </div>
    );
  }

  return (
    <>
      {/* Filtro por categoría */}
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm font-medium text-txt-body">Categoría:</label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas ({permissions.length})</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat} ({permissions.filter((p) => p.category === cat).length})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de permisos */}
      <div className="overflow-hidden rounded-lg border border-line-struct">
        <Table>
          <TableHeader>
            <TableRow className="bg-subtle">
              <TableHead className="font-semibold">Código</TableHead>
              <TableHead className="font-semibold">Recurso</TableHead>
              <TableHead className="font-semibold">Acción</TableHead>
              <TableHead className="font-semibold">Descripción</TableHead>
              <TableHead className="text-center font-semibold">
                Categoría
              </TableHead>
              <TableHead className="text-center font-semibold">Tipo</TableHead>
              <TableHead className="text-right font-semibold">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPermissions.map((permission) => {
              const isSystem = permission.is_system;

              return (
                <TableRow
                  key={permission.id_permission}
                  className="hover:bg-subtle/50"
                >
                  <TableCell>
                    <code className="rounded bg-subtle px-2 py-1 text-xs font-medium text-brand">
                      {permission.code}
                    </code>
                  </TableCell>
                  <TableCell className="text-txt-muted">
                    {permission.resource}
                  </TableCell>
                  <TableCell className="text-txt-muted">
                    {permission.action}
                  </TableCell>
                  <TableCell className="text-sm text-txt-body">
                    {permission.description}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{permission.category}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {isSystem ? (
                      <Badge
                        className="border-brand text-brand"
                        variant="outline"
                      >
                        Sistema
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(permission.id_permission)}
                        disabled={isSystem}
                        title={
                          isSystem
                            ? "No se pueden editar permisos del sistema"
                            : "Editar permiso"
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setPermissionToDelete(permission.id_permission)
                        }
                        disabled={isSystem}
                        title={
                          isSystem
                            ? "No se pueden eliminar permisos del sistema"
                            : "Eliminar permiso"
                        }
                        className="text-status-critical hover:text-status-critical"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de confirmación */}
      <AlertDialog
        open={permissionToDelete !== null}
        onOpenChange={(open: boolean) => !open && setPermissionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-status-alert" />
              ¿Eliminar permiso?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El permiso será eliminado de
              todos los roles que lo tengan asignado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-status-critical hover:bg-status-critical/90"
              disabled={deletePermissionMutation.isPending}
            >
              {deletePermissionMutation.isPending
                ? "Eliminando..."
                : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
