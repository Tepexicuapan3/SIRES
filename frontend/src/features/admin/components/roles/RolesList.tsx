/**
 * RolesList - Lista de roles con acciones CRUD
 *
 * Muestra todos los roles del sistema con:
 * - Nombre, descripción, prioridad
 * - Count de permisos asignados
 * - Badge de rol admin
 * - Acciones: Ver detalle, Editar, Eliminar
 */

import { useState } from "react";
import { Shield, Edit, Trash2, Eye, AlertCircle } from "lucide-react";
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
import { useDeleteRole } from "@/features/admin/hooks";
import type { RoleWithCount } from "@/api/types/roles.types";
import { toast } from "sonner";

interface RolesListProps {
  roles: RoleWithCount[];
  isLoading?: boolean;
  onEdit: (roleId: number) => void;
  onViewDetail: (roleId: number) => void;
}

export const RolesList = ({
  roles,
  isLoading,
  onEdit,
  onViewDetail,
}: RolesListProps) => {
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
  const deleteRoleMutation = useDeleteRole();

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;

    try {
      await deleteRoleMutation.mutateAsync(roleToDelete);
      toast.success("Rol eliminado correctamente");
      setRoleToDelete(null);
    } catch (error: any) {
      const errorMessage =
        error.message || "No se pudo eliminar el rol. Intenta de nuevo.";
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-txt-muted">Cargando roles...</div>
      </div>
    );
  }

  if (!roles || roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Shield className="mb-4 h-12 w-12 text-txt-muted" />
        <h3 className="text-lg font-semibold text-txt-body">
          No hay roles registrados
        </h3>
        <p className="text-sm text-txt-muted">
          Crea el primer rol para comenzar
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-line-struct">
        <Table>
          <TableHeader>
            <TableRow className="bg-subtle">
              <TableHead className="font-semibold">Rol</TableHead>
              <TableHead className="font-semibold">Código</TableHead>
              <TableHead className="font-semibold text-center">
                Permisos
              </TableHead>
              <TableHead className="font-semibold text-center">
                Prioridad
              </TableHead>
              <TableHead className="font-semibold text-center">Tipo</TableHead>
              <TableHead className="text-right font-semibold">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => {
              const isSystemRole = role.id_rol <= 22;
              const isAdmin = role.is_admin === 1;

              return (
                <TableRow key={role.id_rol} className="hover:bg-subtle/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-brand" />
                      <span className="font-medium text-txt-body">
                        {role.nom_rol}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-subtle px-2 py-1 text-xs text-txt-muted">
                      {role.cod_rol}
                    </code>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono">
                      {role.permissions_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm text-txt-muted">
                      {role.priority}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {isAdmin ? (
                      <Badge className="bg-status-critical text-white">
                        Admin
                      </Badge>
                    ) : isSystemRole ? (
                      <Badge
                        variant="outline"
                        className="border-brand text-brand"
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
                        onClick={() => onViewDetail(role.id_rol)}
                        title="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(role.id_rol)}
                        disabled={isSystemRole}
                        title={
                          isSystemRole
                            ? "No se pueden editar roles del sistema"
                            : "Editar rol"
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRoleToDelete(role.id_rol)}
                        disabled={isSystemRole}
                        title={
                          isSystemRole
                            ? "No se pueden eliminar roles del sistema"
                            : "Eliminar rol"
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

      {/* Confirmación de eliminación */}
      <AlertDialog
        open={roleToDelete !== null}
        onOpenChange={(open) => !open && setRoleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-status-alert" />
              ¿Eliminar rol?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El rol será eliminado
              permanentemente del sistema.
              <br />
              <br />
              <strong>NOTA:</strong> Solo se pueden eliminar roles que no tienen
              usuarios asignados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-status-critical hover:bg-status-critical/90"
              disabled={deleteRoleMutation.isPending}
            >
              {deleteRoleMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
