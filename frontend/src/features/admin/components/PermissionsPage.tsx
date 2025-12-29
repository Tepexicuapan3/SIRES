/**
 * Página de Administración de Permisos RBAC 2.0
 * Permite visualizar y administrar la asignación de permisos a roles
 */

import { useState } from "react";
import { Key, Shield, Plus, Trash2, Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";

// Mock data (después conectar con API)
const MOCK_ROLES = [
  { id: 22, nombre: "ADMINISTRADOR", permisos_count: 59, is_admin: true },
  { id: 1, nombre: "MEDICOS", permisos_count: 19, is_admin: false },
  { id: 2, nombre: "RECEPCION", permisos_count: 9, is_admin: false },
  { id: 7, nombre: "FARMACIA", permisos_count: 5, is_admin: false },
];

const MOCK_PERMISSIONS_BY_CATEGORY = {
  EXPEDIENTES: [
    { id: 1, code: "expedientes:create", description: "Crear expedientes" },
    { id: 2, code: "expedientes:read", description: "Ver expedientes" },
    { id: 3, code: "expedientes:update", description: "Modificar expedientes" },
    { id: 4, code: "expedientes:delete", description: "Eliminar expedientes" },
  ],
  USUARIOS: [
    { id: 5, code: "usuarios:create", description: "Crear usuarios" },
    { id: 6, code: "usuarios:read", description: "Ver usuarios" },
    { id: 7, code: "usuarios:update", description: "Modificar usuarios" },
    { id: 8, code: "usuarios:delete", description: "Eliminar usuarios" },
  ],
  CONSULTAS: [
    { id: 21, code: "consultas:create", description: "Crear consulta" },
    { id: 22, code: "consultas:read", description: "Ver consultas" },
    { id: 23, code: "consultas:update", description: "Modificar consultas" },
  ],
};

export const PermissionsPage = () => {
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<string>("");

  const handleAssignPermission = () => {
    if (!selectedRole || !selectedPermission) {
      toast.error("Seleccioná un rol y un permiso");
      return;
    }

    // Aquí iría la llamada a la API
    toast.success("Permiso asignado correctamente", {
      description: `Permiso ${selectedPermission} asignado al rol`,
    });
    setIsAssignDialogOpen(false);
    setSelectedPermission("");
  };

  const handleRevokePermission = (roleId: number, permissionCode: string) => {
    // Aquí iría la llamada a la API
    toast.success("Permiso revocado", {
      description: `${permissionCode} eliminado del rol`,
    });
  };

  const getRoleName = (roleId: number) => {
    return MOCK_ROLES.find((r) => r.id === roleId)?.nombre || "Desconocido";
  };

  return (
    <div className="min-h-screen bg-app p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand/10 rounded-lg">
                <Key className="size-6 text-brand" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-txt-body">
                  Gestión de Permisos
                </h1>
                <p className="text-txt-muted">
                  Configurar permisos RBAC 2.0 por rol
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Roles Activos</CardDescription>
              <CardTitle className="text-4xl">{MOCK_ROLES.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="stable">Configurados</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Permisos Totales</CardDescription>
              <CardTitle className="text-4xl">59</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="info">13 categorías</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Asignaciones</CardDescription>
              <CardTitle className="text-4xl">127</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Relaciones</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Overrides</CardDescription>
              <CardTitle className="text-4xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="alert">User-level</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Roles */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Roles del Sistema</CardTitle>
                <CardDescription>
                  Click en un rol para ver sus permisos
                </CardDescription>
              </div>
              <Dialog
                open={isAssignDialogOpen}
                onOpenChange={setIsAssignDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button disabled={!selectedRole}>
                    <Plus className="mr-2 size-4" />
                    Asignar Permiso
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Asignar Permiso a Rol</DialogTitle>
                    <DialogDescription>
                      Asignando permiso a:{" "}
                      <strong>
                        {selectedRole && getRoleName(selectedRole)}
                      </strong>
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium text-txt-body mb-2 block">
                        Seleccionar Permiso
                      </label>
                      <Select
                        value={selectedPermission}
                        onValueChange={setSelectedPermission}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Elegí un permiso" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(MOCK_PERMISSIONS_BY_CATEGORY).map(
                            ([category, perms]) => (
                              <div key={category}>
                                <div className="px-2 py-1.5 text-xs font-semibold text-txt-muted">
                                  {category}
                                </div>
                                {perms.map((perm) => (
                                  <SelectItem key={perm.code} value={perm.code}>
                                    {perm.code} - {perm.description}
                                  </SelectItem>
                                ))}
                              </div>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAssignDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleAssignPermission}>
                      <Check className="mr-2 size-4" />
                      Asignar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol</TableHead>
                  <TableHead>Permisos Asignados</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_ROLES.map((role) => (
                  <TableRow
                    key={role.id}
                    className={selectedRole === role.id ? "bg-brand/5" : ""}
                    onClick={() => setSelectedRole(role.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell className="font-medium">{role.nombre}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          role.permisos_count > 0 ? "stable" : "secondary"
                        }
                      >
                        {role.permisos_count} permisos
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {role.is_admin ? (
                        <Badge variant="critical">
                          <Shield className="mr-1 size-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="info">Estándar</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver Detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Permisos por Categoría */}
        {selectedRole && (
          <Card>
            <CardHeader>
              <CardTitle>Permisos de: {getRoleName(selectedRole)}</CardTitle>
              <CardDescription>
                Gestionar permisos asignados a este rol
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.entries(MOCK_PERMISSIONS_BY_CATEGORY).map(
                ([category, permissions]) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <h3 className="text-sm font-semibold text-txt-body mb-3 flex items-center gap-2">
                      <div className="size-2 rounded-full bg-brand" />
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permissions.map((perm) => (
                        <div
                          key={perm.code}
                          className="flex items-center justify-between p-3 border border-line-struct rounded-lg bg-paper"
                        >
                          <div className="flex-1">
                            <code className="text-sm font-mono text-brand">
                              {perm.code}
                            </code>
                            <p className="text-xs text-txt-muted mt-1">
                              {perm.description}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRevokePermission(selectedRole, perm.code)
                            }
                            className="text-status-critical hover:text-status-critical hover:bg-status-critical/10"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PermissionsPage;
