import { useState } from "react";
import {
  Shield,
  Plus,
  Trash2,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  useUserOverrides,
  useAddUserOverride,
  useRemoveUserOverride,
  useUserEffectivePermissions,
  usePermissionsCatalog,
} from "../../hooks/useAdminPermissions";
import type { UserPermissionOverride } from "@api/types";

/**
 * UserPermissionOverrides - Gestión de permisos temporales/excepcionales
 *
 * ARQUITECTURA:
 * - Lista de overrides actuales con efecto (ALLOW/DENY)
 * - Dialog para agregar nuevo override con:
 *   * Select de permiso (autocomplete)
 *   * Radio: ALLOW / DENY
 *   * DatePicker: Fecha de expiración (opcional)
 * - Dialog para ver permisos efectivos consolidados (roles + overrides)
 *
 * REGLAS DE NEGOCIO:
 * - DENY tiene prioridad sobre ALLOW
 * - DENY tiene prioridad sobre permisos de roles
 * - Fecha expiración opcional (null = sin expiración)
 * - No permitir fechas pasadas
 * - Overrides expirados se muestran pero no aplican
 *
 * HOOKS USADOS:
 * - useUserOverrides(userId): Obtener overrides actuales
 * - useUserEffectivePermissions(userId): Permisos consolidados (roles + overrides)
 * - usePermissionsCatalog(): Catálogo de permisos disponibles
 * - useAddUserOverride(): Agregar nuevo override
 * - useRemoveUserOverride(): Eliminar override
 *
 * PROPS:
 * - userId: ID del usuario a gestionar
 */

interface UserPermissionOverridesProps {
  userId: number;
}

export function UserPermissionOverrides({
  userId,
}: UserPermissionOverridesProps) {
  // ============================================================
  // ESTADO LOCAL
  // ============================================================

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEffectiveDialog, setShowEffectiveDialog] = useState(false);
  const [overrideToDelete, setOverrideToDelete] =
    useState<UserOverride | null>(null);

  // Form state para agregar override
  const [selectedPermissionCode, setSelectedPermissionCode] =
    useState<string>("");
  const [effect, setEffect] = useState<"ALLOW" | "DENY">("ALLOW");
  const [expiresAt, setExpiresAt] = useState<string>("");

  // ============================================================
  // TANSTACK QUERY HOOKS
  // ============================================================

  const { data: overridesData, isLoading: isLoadingOverrides } =
    useUserOverrides(userId);
  const overrides = overridesData?.overrides || [];

  const { data: effectivePermissions, isLoading: isLoadingEffective } =
    useUserEffectivePermissions(userId);

  // IMPORTANTE: usePermissionsCatalog retorna objeto {permissions: [...], by_category: {...}}
  // Aquí extraemos solo el array de permissions
  const { data: catalogData } = usePermissionsCatalog();
  const allPermissions = catalogData?.permissions || [];

  // Mutations
  const addOverrideMutation = useAddUserOverride(userId);
  const removeOverrideMutation = useRemoveUserOverride(userId);

  // ============================================================
  // COMPUTED VALUES
  // ============================================================

  /**
   * Permisos efectivos del usuario
   *
   * NOTA: El backend retorna:
   * - permissions: string[] (códigos simples)
   * - overrides: Array con { permission_code, effect, ... }
   *
   * Para mostrar DENY, usamos los overrides directamente
   */

  /**
   * Permisos concedidos (de roles, sin DENYs)
   * Filtramos los que tienen override DENY
   */
  const deniedCodes = new Set(
    effectivePermissions?.overrides
      .filter((o) => o.effect === "DENY" && !o.is_expired)
      .map((o) => o.permission_code) || [],
  );

  const grantedPermissions =
    effectivePermissions?.permissions.filter(
      (code) => !deniedCodes.has(code),
    ) || [];

  /**
   * Permisos denegados (OVERRIDE_DENY activos)
   */
  const deniedPermissions =
    effectivePermissions?.overrides.filter(
      (o) => o.effect === "DENY" && !o.is_expired,
    ) || [];

  // ============================================================
  // FORMATEO DE DATOS
  // ============================================================

  /**
   * Formatear fecha de expiración
   */
  const formatExpiration = (dateString: string | null) => {
    if (!dateString) return "Sin expiración";

    const date = new Date(dateString);
    const now = new Date();
    const isExpired = date < now;

    const formatted = new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);

    return isExpired ? `Expiró: ${formatted}` : `Expira: ${formatted}`;
  };

  /**
   * Verificar si un override está expirado
   */
  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  /**
   * Obtener color del badge según efecto
   */
  const getEffectColor = (effect: "ALLOW" | "DENY") => {
    return effect === "ALLOW" ? "bg-status-stable" : "bg-status-critical";
  };

  /**
   * Validar fecha de expiración (no permitir fechas pasadas)
   */
  const validateExpirationDate = (dateString: string) => {
    if (!dateString) return true; // Opcional
    const selectedDate = new Date(dateString);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fecha
    return selectedDate >= now;
  };

  // ============================================================
  // HANDLERS - AGREGAR OVERRIDE
  // ============================================================

  /**
   * Agregar nuevo permission override
   */
  const handleAddOverride = async () => {
    if (!selectedPermissionCode) {
      toast.error("Seleccioná un permiso");
      return;
    }

    if (expiresAt && !validateExpirationDate(expiresAt)) {
      toast.error("La fecha de expiración no puede ser en el pasado");
      return;
    }

    try {
      await addOverrideMutation.mutateAsync({
        permission_code: selectedPermissionCode,
        effect,
        expires_at: expiresAt || undefined,
      });

      toast.success(
        `Override ${effect === "ALLOW" ? "concedido" : "denegado"} correctamente`,
      );

      // Reset form
      setShowAddDialog(false);
      setSelectedPermissionCode("");
      setEffect("ALLOW");
      setExpiresAt("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al agregar override";
      toast.error(message);
    }
  };

  // ============================================================
  // HANDLERS - ELIMINAR OVERRIDE
  // ============================================================

  /**
   * Eliminar permission override
   */
  const handleRemoveOverride = async () => {
    if (!overrideToDelete) return;

    try {
      await removeOverrideMutation.mutateAsync(
        overrideToDelete.permission_code,
      );

      toast.success("Override eliminado correctamente");
      setOverrideToDelete(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al eliminar override";
      toast.error(message);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (isLoadingOverrides) {
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
              Permisos Excepcionales (Overrides)
            </h3>
            <p className="text-sm text-txt-muted mt-1">
              Permisos temporales que sobrescriben los permisos de roles
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEffectiveDialog(true)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Ver Permisos Efectivos
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="gap-2 bg-brand hover:bg-brand-hover"
            >
              <Plus className="h-4 w-4" />
              Agregar Override
            </Button>
          </div>
        </div>

        {/* Lista de overrides actuales */}
        {overrides.length === 0 ? (
          <div className="text-center py-8 text-txt-muted">
            <Shield className="mx-auto h-12 w-12 mb-2" />
            <p>No hay permisos excepcionales configurados</p>
            <p className="text-sm mt-1">
              Los overrides permiten conceder o denegar permisos específicos
              temporalmente
            </p>
          </div>
        ) : (
          <div className="border border-line-struct rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permiso</TableHead>
                  <TableHead>Efecto</TableHead>
                  <TableHead>Expiración</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overrides.map((override) => {
                  const expired = isExpired(override.expires_at);

                  return (
                    <TableRow
                      key={override.permission_code}
                      className={expired ? "opacity-50" : ""}
                    >
                      {/* Código del permiso */}
                      <TableCell className="font-mono text-sm">
                        {override.permission_code}
                      </TableCell>

                      {/* Efecto (ALLOW/DENY) */}
                      <TableCell>
                        <Badge className={getEffectColor(override.effect)}>
                          {override.effect === "ALLOW" ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              CONCEDER
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              DENEGAR
                            </span>
                          )}
                        </Badge>
                      </TableCell>

                      {/* Fecha de expiración */}
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-txt-muted" />
                          {formatExpiration(override.expires_at)}
                        </div>
                      </TableCell>

                      {/* Estado */}
                      <TableCell>
                        {expired ? (
                          <Badge
                            variant="secondary"
                            className="bg-txt-muted text-white"
                          >
                            Expirado
                          </Badge>
                        ) : (
                          <Badge className="bg-status-stable">Activo</Badge>
                        )}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOverrideToDelete(override)}
                          className="gap-2 text-status-critical hover:text-status-critical hover:bg-status-critical/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Info sobre prioridades */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="font-medium text-blue-900">Prioridad de Permisos:</p>
          <ul className="mt-2 space-y-1 text-blue-700">
            <li>1. DENY override (mayor prioridad)</li>
            <li>2. ALLOW override</li>
            <li>3. Permisos de roles</li>
          </ul>
        </div>
      </div>

      {/* ========================================================== */}
      {/* DIALOG: Agregar Override */}
      {/* ========================================================== */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar Permiso Excepcional</DialogTitle>
            <DialogDescription>
              Concedé o denegá un permiso específico de forma temporal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selector de permiso */}
            <div>
              <Label htmlFor="permission">Permiso</Label>
              <Select
                value={selectedPermissionCode}
                onValueChange={setSelectedPermissionCode}
              >
                <SelectTrigger id="permission" className="mt-2">
                  <SelectValue placeholder="Seleccioná un permiso" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {allPermissions.map((permission) => (
                    <SelectItem key={permission.code} value={permission.code}>
                      <div>
                        <div className="font-medium">{permission.code}</div>
                        {permission.description && (
                          <div className="text-xs text-txt-muted">
                            {permission.description}
                          </div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Efecto (ALLOW/DENY) */}
            <div>
              <Label>Efecto</Label>
              <RadioGroup
                value={effect}
                onValueChange={(value: string) =>
                  setEffect(value as "ALLOW" | "DENY")
                }
                className="mt-2 space-y-2"
              >
                <div className="flex items-center gap-3 p-3 border border-line-struct rounded-lg hover:bg-subtle transition-colors">
                  <RadioGroupItem value="ALLOW" id="allow" />
                  <Label htmlFor="allow" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-status-stable" />
                      <span className="font-medium">CONCEDER</span>
                    </div>
                    <div className="text-sm text-txt-muted mt-1">
                      Otorgar este permiso aunque no lo tenga por rol
                    </div>
                  </Label>
                </div>

                <div className="flex items-center gap-3 p-3 border border-line-struct rounded-lg hover:bg-subtle transition-colors">
                  <RadioGroupItem value="DENY" id="deny" />
                  <Label htmlFor="deny" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-status-critical" />
                      <span className="font-medium">DENEGAR</span>
                    </div>
                    <div className="text-sm text-txt-muted mt-1">
                      Revocar este permiso aunque lo tenga por rol
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Fecha de expiración (opcional) */}
            <div>
              <Label htmlFor="expires-at">
                Fecha de Expiración{" "}
                <span className="text-txt-muted font-normal">(opcional)</span>
              </Label>
              <input
                type="date"
                id="expires-at"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="mt-2 w-full px-3 py-2 border border-line-struct rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <p className="text-xs text-txt-muted mt-1">
                Dejá vacío para que no expire nunca
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setSelectedPermissionCode("");
                setEffect("ALLOW");
                setExpiresAt("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddOverride}
              disabled={
                !selectedPermissionCode || addOverrideMutation.isPending
              }
              className="bg-brand hover:bg-brand-hover"
            >
              {addOverrideMutation.isPending
                ? "Agregando..."
                : "Agregar Override"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================== */}
      {/* DIALOG: Ver Permisos Efectivos */}
      {/* ========================================================== */}
      <Dialog open={showEffectiveDialog} onOpenChange={setShowEffectiveDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permisos Efectivos del Usuario</DialogTitle>
            <DialogDescription>
              Consolidación final de permisos considerando roles y overrides
            </DialogDescription>
          </DialogHeader>

          {isLoadingEffective ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Permisos concedidos */}
              <div>
                <h4 className="font-semibold text-txt-body mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-status-stable" />
                  Permisos Concedidos ({grantedPermissions.length})
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {grantedPermissions.length > 0 ? (
                    grantedPermissions.map((code) => (
                      <div
                        key={code}
                        className="p-2 bg-status-stable/10 border border-status-stable/30 rounded text-sm"
                      >
                        <code className="font-mono">{code}</code>
                        <div className="text-xs text-txt-muted mt-1">
                          De roles asignados
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-2 text-txt-muted text-sm">
                      No hay permisos concedidos
                    </p>
                  )}
                </div>
              </div>

              {/* Permisos denegados */}
              <div>
                <h4 className="font-semibold text-txt-body mb-2 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-status-critical" />
                  Permisos Denegados ({deniedPermissions.length})
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {deniedPermissions.length > 0 ? (
                    deniedPermissions.map((override) => (
                      <div
                        key={override.permission_code}
                        className="p-2 bg-status-critical/10 border border-status-critical/30 rounded text-sm"
                      >
                        <code className="font-mono">
                          {override.permission_code}
                        </code>
                        <div className="text-xs text-txt-muted mt-1">
                          Override DENY
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-2 text-txt-muted text-sm">
                      No hay permisos denegados
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowEffectiveDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================== */}
      {/* DIALOG: Confirmar Eliminar Override */}
      {/* ========================================================== */}
      <Dialog
        open={!!overrideToDelete}
        onOpenChange={() => setOverrideToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que querés eliminar este override?
            </DialogDescription>
          </DialogHeader>

          {overrideToDelete && (
            <div className="p-4 bg-status-critical/10 border border-status-critical rounded-lg">
              <p className="font-medium">
                Permiso:{" "}
                <code className="font-mono">
                  {overrideToDelete.permission_code}
                </code>
              </p>
              <p className="text-sm mt-2">
                Efecto: <strong>{overrideToDelete.effect}</strong>
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideToDelete(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRemoveOverride}
              disabled={removeOverrideMutation.isPending}
              className="bg-status-critical hover:bg-status-critical/90 text-white"
            >
              {removeOverrideMutation.isPending
                ? "Eliminando..."
                : "Eliminar Override"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
