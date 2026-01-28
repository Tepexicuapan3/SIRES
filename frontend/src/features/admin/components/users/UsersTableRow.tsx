/**
 * ============================================
 * COMPONENTE: UsersTableRow
 * ============================================
 *
 * Fila individual de la tabla de usuarios con todas las columnas y acciones.
 *
 * **Decisión de Diseño:**
 * - React.memo para evitar re-renders innecesarios (tabla puede tener 100+ filas)
 * - Hover effect sutil con tokens Metro (hover:bg-subtle)
 * - Dropdown menu para acciones (Ver, Editar, Activar/Desactivar)
 * - Reutiliza componentes existentes: UserAvatar, UserRoleBadge, UserStatusBadge
 *
 * **Patrón Aplicado:**
 * - Presentational component: recibe props, renderiza UI
 * - Performance optimization: React.memo con comparación por id_usuario
 * - Composition: combina múltiples componentes pequeños
 * - Action delegation: callbacks para manejar eventos (no lógica interna)
 *
 * **Estructura de la Fila (6 columnas):**
 * 1. Avatar + Username
 * 2. Nombre completo (nombre + paterno + materno)
 * 3. Email (correo)
 * 4. Rol primario (badge)
 * 5. Estado (badge con dot indicator)
 * 6. Acciones (dropdown menu)
 */

import { memo } from "react";
import { MoreHorizontal, Eye, Edit, Power } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { UserRoleBadge } from "./UserRoleBadge";
import { UserStatusBadge } from "./UserStatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import type { User } from "@api/types";
import { cn } from "@/lib/utils";

/**
 * Props del componente
 */
export interface UsersTableRowProps {
  /** Datos del usuario */
  user: User;

  /** Callback al ver detalle del usuario */
  onViewDetail: (userId: number) => void;

  /** Callback al editar usuario */
  onEdit: (userId: number) => void;

  /** Callback al cambiar estado del usuario (Activar/Desactivar) */
  onToggleStatus: (userId: number, currentStatus: string) => void;

  /** Clase CSS adicional para customización */
  className?: string;
}

/**
 * Componente de fila de tabla de usuarios
 *
 * **Por qué React.memo:**
 * - Las tablas pueden tener 100+ filas, cada una con múltiples componentes
 * - Al hacer hover sobre una fila, NO queremos re-renderizar las otras 99
 * - Al actualizar un usuario, solo re-renderizamos ESA fila
 * - Performance boost significativo en tablas grandes
 *
 * @example
 * // Uso básico en tabla
 * {users.map((user) => (
 *   <UsersTableRow
 *     key={user.id_usuario}
 *     user={user}
 *     onViewDetail={handleViewDetail}
 *     onEdit={handleEdit}
 *     onToggleStatus={handleToggleStatus}
 *   />
 * ))}
 */
const UsersTableRowComponent: React.FC<UsersTableRowProps> = ({
  user,
  onViewDetail,
  onEdit,
  onToggleStatus,
  className,
}) => {
  // ============================================================
  // COMPUTED VALUES
  // ============================================================

  /**
   * Nombre completo concatenado (nombre + apellido paterno + apellido materno)
   * Ejemplo: "Juan García López"
   */
  const fullName = `${user.nombre} ${user.paterno} ${user.materno}`.trim();

  /**
   * Estado booleano para UserStatusBadge
   * "A" = Activo → true
   * "B" = Baja/Inactivo → false
   */
  const isActive = user.est_usuario === "A";

  /**
   * Texto para la acción de cambio de estado
   * Si está activo → "Desactivar"
   * Si está inactivo → "Activar"
   */
  const toggleStatusLabel = isActive ? "Desactivar" : "Activar";

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  /**
   * Handler para ver detalle del usuario
   */
  const handleViewDetail = () => {
    onViewDetail(user.id_usuario);
  };

  /**
   * Handler para editar usuario
   */
  const handleEdit = () => {
    onEdit(user.id_usuario);
  };

  /**
   * Handler para cambiar estado del usuario
   */
  const handleToggleStatus = () => {
    onToggleStatus(user.id_usuario, user.est_usuario);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <TableRow className={cn(className)}>
      {/* COLUMNA 1: Avatar + Username */}
      <TableCell>
        <div className="flex items-center gap-3">
          {/* Avatar con iniciales */}
          <UserAvatar fullName={fullName} size="sm" />

          {/* Username */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-txt-body">
              {user.usuario}
            </span>
            {/* ID del usuario (subtle, para debugging/support) */}
            <span className="text-xs text-txt-muted">
              ID: {user.id_usuario}
            </span>
          </div>
        </div>
      </TableCell>

      {/* COLUMNA 2: Nombre Completo */}
      <TableCell>
        <span className="text-sm text-txt-body">{fullName}</span>
      </TableCell>

      {/* COLUMNA 3: Email */}
      <TableCell>
        <span className="text-sm text-txt-body">{user.correo}</span>
      </TableCell>

      {/* COLUMNA 4: Rol Primario */}
      <TableCell>
        <UserRoleBadge roleName={user.rol_primario} />
      </TableCell>

      {/* COLUMNA 5: Estado */}
      <TableCell>
        <UserStatusBadge isActive={isActive} />
      </TableCell>

      {/* COLUMNA 6: Acciones (Dropdown Menu) */}
      <TableCell className="text-right">
        <DropdownMenu>
          {/* Trigger: Botón de 3 puntos */}
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              aria-label={`Acciones para ${user.usuario}`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>

          {/* Content: Opciones del menú */}
          <DropdownMenuContent align="end" className="w-48">
            {/* Opción 1: Ver Detalle */}
            <DropdownMenuItem onClick={handleViewDetail}>
              <Eye className="size-4" />
              <span>Ver Detalle</span>
            </DropdownMenuItem>

            {/* Opción 2: Editar */}
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="size-4" />
              <span>Editar</span>
            </DropdownMenuItem>

            {/* Separador visual */}
            <DropdownMenuSeparator />

            {/* Opción 3: Activar/Desactivar (destructive si va a desactivar) */}
            <DropdownMenuItem
              onClick={handleToggleStatus}
              variant={isActive ? "destructive" : "default"}
            >
              <Power className="size-4" />
              <span>{toggleStatusLabel}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

/**
 * Función de comparación para React.memo
 *
 * **Por qué custom compare:**
 * - Por defecto, React.memo hace shallow comparison de TODAS las props
 * - Esto significa que si cambia cualquier callback (onViewDetail, onEdit, etc.),
 *   se re-renderiza TODA la tabla
 * - Con custom compare, solo re-renderizamos si cambió el USER DATA
 *
 * **Cómo funciona:**
 * - Compara solo user.id_usuario (el resto de campos del user no cambia sin cambiar el id)
 * - Ignora cambios en callbacks (asumimos que son estables o no importan)
 *
 * **Trade-off:**
 * - Pro: Massive performance boost en tablas grandes
 * - Contra: Si el callback cambia lógica, no se actualiza hasta que cambie el user
 * - Solución: Usar useCallback en el componente padre para estabilizar callbacks
 */
function arePropsEqual(
  prevProps: UsersTableRowProps,
  nextProps: UsersTableRowProps,
): boolean {
  // Solo re-renderizar si cambió el ID del usuario (significa que es otro usuario)
  // O si cambió algún dato del usuario (detectado por identidad del objeto)
  return (
    prevProps.user.id_usuario === nextProps.user.id_usuario &&
    prevProps.user.est_usuario === nextProps.user.est_usuario &&
    prevProps.user.rol_primario === nextProps.user.rol_primario &&
    prevProps.user.usuario === nextProps.user.usuario &&
    prevProps.user.correo === nextProps.user.correo &&
    prevProps.user.nombre === nextProps.user.nombre &&
    prevProps.user.paterno === nextProps.user.paterno &&
    prevProps.user.materno === nextProps.user.materno
  );
}

/**
 * Export memoizado del componente
 */
export const UsersTableRow = memo(UsersTableRowComponent, arePropsEqual);
