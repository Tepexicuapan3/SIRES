import { useState, useMemo } from "react";
import { UserPlus, Star, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useUserRoles,
  useAssignRoles,
  useSetPrimaryRole,
  useRevokeRole,
} from "../../hooks/useAdminUsers";
import { useRoles } from "../../hooks/useRoles";
import type { UserRole } from "@api/types/users.types";

/**
 * UserRolesManager - Gestión de roles de un usuario
 *
 * ARQUITECTURA:
 * - Muestra roles actuales con badge especial para rol primario (★)
 * - Dialog para asignar múltiples roles a la vez
 * - Select para cambiar rol primario entre los roles ya asignados
 * - Confirmación para revocar roles
 *
 * REGLAS DE NEGOCIO:
 * - Usuario debe tener AL MENOS 1 rol (no permitir revocar último)
 * - Solo UN rol puede ser primario (is_primary=true)
 * - Si se revoca rol primario, backend auto-asigna otro como primario
 *
 * HOOKS USADOS:
 * - useUserRoles(userId): Obtener roles actuales del usuario
 * - useRoles(): Catálogo completo de roles para el selector
 * - useAssignRoles(): Asignar múltiples roles (bulk)
 * - useSetPrimaryRole(): Cambiar rol primario
 * - useRevokeRole(): Eliminar rol
 *
 * PROPS:
 * - userId: ID del usuario a gestionar
 */

interface UserRolesManagerProps {
  userId: number;
}

export function UserRolesManager({ userId }: UserRolesManagerProps) {
  // ============================================================
  // ESTADO LOCAL
  // ============================================================

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showPrimaryDialog, setShowPrimaryDialog] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [newPrimaryRoleId, setNewPrimaryRoleId] = useState<number | null>(null);
  const [roleToRevoke, setRoleToRevoke] = useState<UserRole | null>(null);

  // ============================================================
  // TANSTACK QUERY HOOKS
  // ============================================================

  // Roles actuales del usuario
  const { data: userRoles = [], isLoading } = useUserRoles(userId);

  // Catálogo completo de roles (para el selector)
  const {
    data: allRoles = [],
    isLoading: isLoadingRoles,
    isError: isErrorRoles,
  } = useRoles();

  // Mutations
  const assignRolesMutation = useAssignRoles(userId);
  const setPrimaryRoleMutation = useSetPrimaryRole(userId);
  const revokeRoleMutation = useRevokeRole(userId);

  // ============================================================
  // COMPUTED VALUES
  // ============================================================

  /**
   * Roles disponibles para asignar (no están actualmente asignados)
   */
  const availableRoles = useMemo(() => {
    const assignedIds = new Set(userRoles.map((ur) => ur.id_rol));
    return allRoles.filter((role) => !assignedIds.has(role.id_rol));
  }, [allRoles, userRoles]);

  /**
   * Rol primario actual
   */
  const primaryRole = useMemo(() => {
    return userRoles.find((ur) => ur.is_primary);
  }, [userRoles]);

  /**
   * Validar si se puede revocar un rol
   * NO permitir si es el último rol del usuario
   */
  const canRevokeRole = userRoles.length > 1;

  // ============================================================
  // HANDLERS - ASIGNAR ROLES
  // ============================================================

  /**
   * Toggle de selección de rol en el dialog de asignación
   */
  const toggleRoleSelection = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  /**
   * Asignar roles seleccionados al usuario
   */
  const handleAssignRoles = async () => {
    if (selectedRoleIds.length === 0) {
      toast.error("Seleccioná al menos un rol para asignar");
      return;
    }

    try {
      await assignRolesMutation.mutateAsync({
        role_ids: selectedRoleIds,
      });

      toast.success(
        `${selectedRoleIds.length} rol(es) asignado(s) correctamente`,
      );
      setShowAssignDialog(false);
      setSelectedRoleIds([]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al asignar roles";
      toast.error(message);
    }
  };

  // ============================================================
  // HANDLERS - CAMBIAR ROL PRIMARIO
  // ============================================================

  /**
   * Cambiar el rol primario del usuario
   */
  const handleSetPrimaryRole = async () => {
    if (!newPrimaryRoleId) {
      toast.error("Seleccioná un rol primario");
      return;
    }

    try {
      await setPrimaryRoleMutation.mutateAsync({
        role_id: newPrimaryRoleId,
      });

      toast.success("Rol primario actualizado");
      setShowPrimaryDialog(false);
      setNewPrimaryRoleId(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error al cambiar rol primario";
      toast.error(message);
    }
  };

  // ============================================================
  // HANDLERS - REVOCAR ROL
  // ============================================================

  /**
   * Revocar (eliminar) un rol del usuario
   */
  const handleRevokeRole = async () => {
    if (!roleToRevoke) return;

    if (!canRevokeRole) {
      toast.error("No podés revocar el último rol del usuario");
      return;
    }

    try {
      await revokeRoleMutation.mutateAsync(roleToRevoke.id_rol);

      toast.success(`Rol "${roleToRevoke.rol}" revocado`);
      setRoleToRevoke(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al revocar rol";
      toast.error(message);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  // Error state: Mostrar si falla la carga de roles (probablemente 401)
  if (isErrorRoles) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-status-critical p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-status-critical flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-status-critical">
              Error al cargar roles
            </h3>
            <p className="text-sm text-txt-muted mt-1">
              No se pudieron cargar los roles disponibles. Esto puede deberse a
              un problema de autenticación. Por favor, recargá la página o volvé
              a iniciar sesión.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-line-struct p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-subtle rounded w-1/3"></div>
          <div className="h-20 bg-subtle rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-line-struct p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-txt-body">
              Roles Asignados
            </h3>
            <p className="text-sm text-txt-muted mt-1">
              Gestiona los roles y permisos del usuario
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrimaryDialog(true)}
              disabled={userRoles.length === 0}
              className="gap-2"
            >
              <Star className="h-4 w-4" />
              Cambiar Primario
            </Button>
            <Button
              onClick={() => setShowAssignDialog(true)}
              disabled={availableRoles.length === 0 || isLoadingRoles}
              className="gap-2 bg-brand hover:bg-brand-hover"
            >
              <UserPlus className="h-4 w-4" />
              {isLoadingRoles ? "Cargando..." : "Asignar Roles"}
            </Button>
          </div>
        </div>

        {/* Lista de roles actuales */}
        {userRoles.length === 0 ? (
          <div className="text-center py-8 text-txt-muted">
            <UserPlus className="mx-auto h-12 w-12 mb-2" />
            <p>Este usuario no tiene roles asignados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userRoles.map((userRole) => (
              <div
                key={userRole.id_rol}
                className="flex items-center justify-between p-3 bg-subtle rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {/* Badge de rol */}
                  <Badge
                    variant={userRole.is_primary ? "default" : "secondary"}
                    className={
                      userRole.is_primary
                        ? "bg-brand text-white"
                        : "bg-white border border-line-struct"
                    }
                  >
                    {userRole.rol}
                  </Badge>

                  {/* Indicador de rol primario */}
                  {userRole.is_primary && (
                    <div className="flex items-center gap-1 text-brand text-sm font-medium">
                      <Star className="h-4 w-4 fill-brand" />
                      Rol Primario
                    </div>
                  )}

                  {/* Descripción del rol */}
                  {userRole.desc_rol && (
                    <span className="text-sm text-txt-muted">
                      {userRole.desc_rol}
                    </span>
                  )}
                </div>

                {/* Botón revocar */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRoleToRevoke(userRole)}
                  disabled={!canRevokeRole}
                  className="gap-2 text-status-critical hover:text-status-critical hover:bg-status-critical/10"
                  title={
                    !canRevokeRole
                      ? "No podés revocar el último rol"
                      : "Revocar este rol"
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Revocar
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Advertencia si no puede revocar */}
        {!canRevokeRole && userRoles.length > 0 && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-status-alert/10 border border-status-alert rounded-lg">
            <AlertCircle className="h-5 w-5 text-status-alert flex-shrink-0 mt-0.5" />
            <div className="text-sm text-status-alert">
              <p className="font-medium">Usuario debe tener al menos un rol</p>
              <p className="mt-1">Asigná otro rol antes de revocar el actual</p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* DIALOG: Asignar Roles */}
      {/* ========================================================== */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Asignar Roles al Usuario</DialogTitle>
            <DialogDescription>
              Seleccioná los roles que querés asignar. Podés elegir múltiples
              roles.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {availableRoles.length === 0 ? (
              <p className="text-center text-txt-muted py-8">
                No hay roles disponibles para asignar
              </p>
            ) : (
              availableRoles.map((role) => (
                <div
                  key={role.id_rol}
                  className="flex items-center gap-3 p-3 border border-line-struct rounded-lg hover:bg-subtle transition-colors"
                >
                  <Checkbox
                    id={`role-${role.id_rol}`}
                    checked={selectedRoleIds.includes(role.id_rol)}
                    onCheckedChange={() => toggleRoleSelection(role.id_rol)}
                  />
                  <Label
                    htmlFor={`role-${role.id_rol}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium">{role.desc_rol}</div>
                  </Label>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignDialog(false);
                setSelectedRoleIds([]);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssignRoles}
              disabled={
                selectedRoleIds.length === 0 || assignRolesMutation.isPending
              }
              className="bg-brand hover:bg-brand-hover"
            >
              {assignRolesMutation.isPending
                ? "Asignando..."
                : `Asignar ${selectedRoleIds.length} rol(es)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================== */}
      {/* DIALOG: Cambiar Rol Primario */}
      {/* ========================================================== */}
      <Dialog open={showPrimaryDialog} onOpenChange={setShowPrimaryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Rol Primario</DialogTitle>
            <DialogDescription>
              El rol primario determina los permisos predeterminados del usuario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="primary-role">Rol Primario Actual</Label>
              <div className="mt-2 p-3 bg-subtle rounded-lg">
                <Badge className="bg-brand text-white">
                  {primaryRole?.rol || "Sin rol primario"}
                </Badge>
              </div>
            </div>

            <div>
              <Label htmlFor="new-primary-role">Nuevo Rol Primario</Label>
              <Select
                value={newPrimaryRoleId?.toString()}
                onValueChange={(value) => setNewPrimaryRoleId(parseInt(value))}
              >
                <SelectTrigger id="new-primary-role" className="mt-2">
                  <SelectValue placeholder="Seleccioná un rol" />
                </SelectTrigger>
                <SelectContent>
                  {userRoles
                    .filter((ur) => !ur.is_primary)
                    .map((ur) => (
                      <SelectItem key={ur.id_rol} value={ur.id_rol.toString()}>
                        {ur.rol}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPrimaryDialog(false);
                setNewPrimaryRoleId(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSetPrimaryRole}
              disabled={!newPrimaryRoleId || setPrimaryRoleMutation.isPending}
              className="bg-brand hover:bg-brand-hover"
            >
              {setPrimaryRoleMutation.isPending
                ? "Cambiando..."
                : "Cambiar Rol Primario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================== */}
      {/* DIALOG: Confirmar Revocar Rol */}
      {/* ========================================================== */}
      <Dialog open={!!roleToRevoke} onOpenChange={() => setRoleToRevoke(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Revocación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que querés revocar este rol?
            </DialogDescription>
          </DialogHeader>

          {roleToRevoke && (
            <div className="p-4 bg-status-critical/10 border border-status-critical rounded-lg">
              <p className="font-medium text-txt-body">
                Rol: <span className="text-brand">{roleToRevoke.rol}</span>
              </p>
              {roleToRevoke.is_primary && (
                <p className="text-sm text-status-critical mt-2">
                  ⚠️ Este es el rol primario. Al revocarlo, se asignará
                  automáticamente otro rol como primario.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleToRevoke(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRevokeRole}
              disabled={revokeRoleMutation.isPending}
              className="bg-status-critical hover:bg-status-critical/90 text-white"
            >
              {revokeRoleMutation.isPending ? "Revocando..." : "Revocar Rol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
