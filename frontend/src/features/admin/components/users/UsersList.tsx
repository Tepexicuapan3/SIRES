import { Eye } from "lucide-react";
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
import type { User } from "@api/types";

/**
 * UsersList - Tabla simplificada de usuarios
 *
 * COLUMNAS:
 * - Usuario (username)
 * - Nombre Completo
 * - Correo
 * - Rol Primario
 * - Estado (Activo/Inactivo)
 * - Más Detalles (botón de acción)
 *
 * FILOSOFÍA:
 * - Presentación pura - no maneja lógica de negocio
 * - Usa tipos del backend directamente (paterno, materno, est_usuario)
 * - Solo muestra datos esenciales - detalle completo en vista separada
 *
 * PROPS:
 * - users: Array de usuarios (del hook useUsers)
 * - isLoading: Estado de carga
 * - onViewDetails: Callback para navegar a vista detallada
 */

interface UsersListProps {
  users: User[];
  isLoading: boolean;
  onViewDetails: (userId: number) => void;
}

export function UsersList({ users, isLoading, onViewDetails }: UsersListProps) {
  // ============================================================
  // HELPERS - FORMATEO
  // ============================================================

  /**
   * Construir nombre completo desde campos del backend
   * Backend retorna: nombre, paterno, materno (nombres cortos)
   */
  const getFullName = (user: User) => {
    return `${user.nombre} ${user.paterno} ${user.materno}`;
  };

  /**
   * Obtener color del badge según estado del usuario
   * Backend usa: "A" = Activo, "B" = Baja
   */
  const getStatusConfig = (estado: "A" | "B") => {
    if (estado === "A") {
      return {
        label: "Activo",
        className: "bg-status-stable text-white",
      };
    }
    return {
      label: "Inactivo",
      className: "bg-txt-muted text-white",
    };
  };

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  // ============================================================
  // EMPTY STATE
  // ============================================================

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-line-struct p-12 text-center">
        <h3 className="text-lg font-semibold text-txt-body">
          No hay usuarios registrados
        </h3>
        <p className="mt-2 text-txt-muted">
          Los usuarios aparecerán aquí cuando se registren en el sistema
        </p>
      </div>
    );
  }

  // ============================================================
  // TABLA
  // ============================================================

  return (
    <div className="bg-white rounded-lg shadow-sm border border-line-struct overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Nombre Completo</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Rol Primario</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const statusConfig = getStatusConfig(user.est_usuario);

            return (
              <TableRow key={user.id_usuario}>
                {/* Usuario (username) */}
                <TableCell className="font-medium font-mono">
                  {user.usuario}
                </TableCell>

                {/* Nombre completo */}
                <TableCell>{getFullName(user)}</TableCell>

                {/* Correo */}
                <TableCell className="text-sm text-txt-muted">
                  {user.correo}
                </TableCell>

                {/* Rol primario */}
                <TableCell>
                  {user.rol_primario ? (
                    <Badge variant="default" className="bg-brand text-white">
                      {user.rol_primario}
                    </Badge>
                  ) : (
                    <span className="text-txt-muted text-sm">Sin rol</span>
                  )}
                </TableCell>

                {/* Estado (Activo/Inactivo) */}
                <TableCell>
                  <Badge className={statusConfig.className}>
                    {statusConfig.label}
                  </Badge>
                </TableCell>

                {/* Más Detalles */}
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(user.id_usuario)}
                    className="gap-2"
                    title="Ver información completa del usuario"
                  >
                    <Eye className="h-4 w-4" />
                    Más Detalles
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
