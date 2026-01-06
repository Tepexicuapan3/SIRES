import { useState } from "react";
import { Search, UserCog, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { User } from "@api/types/users.types";

/**
 * UsersList - Tabla de usuarios con búsqueda y acciones
 *
 * CARACTERÍSTICAS:
 * - Búsqueda por nombre o número de expediente
 * - Muestra roles asignados como badges
 * - Badge especial para rol primario (is_primary=true)
 * - Estado activo/inactivo del usuario
 * - Última sesión formateada
 *
 * ACCIONES:
 * - Ver Roles: Navegar a gestión de roles del usuario
 * - Ver Permisos: Navegar a permission overrides del usuario
 *
 * PROPS:
 * - users: Array de usuarios (viene de TanStack Query)
 * - isLoading: Estado de carga
 * - error: Error de la petición
 * - onViewUser: Callback para navegar a vista detalle
 */

interface UsersListProps {
  users: User[];
  isLoading: boolean;
  error: Error | null;
  onViewUser: (userId: number) => void;
}

export function UsersList({
  users,
  isLoading,
  error,
  onViewUser,
}: UsersListProps) {
  // Estado de búsqueda (filtro local)
  const [searchTerm, setSearchTerm] = useState("");

  // ============================================================
  // FILTRADO DE USUARIOS
  // ============================================================

  /**
   * Filtrar usuarios por nombre completo o número de expediente
   * Búsqueda case-insensitive
   */
  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    const fullName =
      `${user.nombre} ${user.apellido_paterno} ${user.apellido_materno}`.toLowerCase();
    const expediente = user.numero_expediente?.toLowerCase() || "";

    return fullName.includes(search) || expediente.includes(search);
  });

  // ============================================================
  // FORMATEO DE DATOS
  // ============================================================

  /**
   * Formatear fecha de última sesión
   * Formato: "DD/MM/YYYY HH:mm"
   */
  const formatLastLogin = (dateString: string | null) => {
    if (!dateString) return "Nunca";

    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  /**
   * Obtener color del badge según estado del usuario
   */
  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-status-stable" : "bg-txt-muted";
  };

  // ============================================================
  // ESTADOS DE LOADING Y ERROR
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-status-critical/10 border border-status-critical text-status-critical px-4 py-3 rounded-lg">
        <p className="font-semibold">Error al cargar usuarios</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  // ============================================================
  // EMPTY STATE
  // ============================================================

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <UserCog className="mx-auto h-12 w-12 text-txt-muted" />
        <h3 className="mt-4 text-lg font-semibold text-txt-body">
          No hay usuarios registrados
        </h3>
        <p className="mt-2 text-txt-muted">
          Los usuarios aparecerán aquí cuando se registren en el sistema
        </p>
      </div>
    );
  }

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-txt-muted" />
          <Input
            type="text"
            placeholder="Buscar por nombre o número de expediente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-txt-muted">
          {filteredUsers.length} de {users.length} usuarios
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg shadow-sm border border-line-struct overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Expediente</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Última Sesión</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-txt-muted"
                >
                  No se encontraron usuarios con "{searchTerm}"
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id_usuario}>
                  {/* Usuario (username) */}
                  <TableCell className="font-medium">{user.usuario}</TableCell>

                  {/* Nombre completo */}
                  <TableCell>
                    {user.nombre} {user.apellido_paterno}{" "}
                    {user.apellido_materno}
                  </TableCell>

                  {/* Número de expediente */}
                  <TableCell className="font-mono text-sm">
                    {user.numero_expediente || "—"}
                  </TableCell>

                  {/* Roles asignados */}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.map((role) => (
                        <Badge
                          key={role.id_rol}
                          variant={role.is_primary ? "default" : "secondary"}
                          className={
                            role.is_primary
                              ? "bg-brand text-white"
                              : "bg-subtle text-txt-body"
                          }
                        >
                          {role.nombre}
                          {role.is_primary && " ★"}
                        </Badge>
                      )) || (
                        <span className="text-txt-muted text-sm">
                          Sin roles
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Estado (activo/inactivo) */}
                  <TableCell>
                    <Badge className={getStatusColor(user.activo)}>
                      {user.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>

                  {/* Última sesión */}
                  <TableCell className="text-sm text-txt-muted">
                    {formatLastLogin(user.ultimo_acceso)}
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewUser(user.id_usuario)}
                        className="gap-2"
                        title="Ver gestión completa (roles + permisos)"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Detalle
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
