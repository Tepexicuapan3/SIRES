/**
 * ============================================
 * COMPONENTE: UsersTableSkeleton (SHADCN)
 * ============================================
 *
 * Loading state usando shadcn Table primitives + skeleton screens.
 *
 * **Decisión de Diseño:**
 * - Usa <Table> de shadcn para consistencia
 * - Skeleton screens > spinners (mejor perceived performance)
 * - Muestra estructura real de la tabla (6 columnas)
 * - Animación pulse sutil (no distrae)
 */

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface UsersTableSkeletonProps {
  /** Número de filas skeleton a mostrar (default: 10) */
  rows?: number;
  /** Clase CSS adicional para el container */
  className?: string;
}

/**
 * Componente de fila skeleton individual
 */
function SkeletonRow() {
  return (
    <TableRow>
      {/* Avatar + Usuario */}
      <TableCell>
        <div className="flex items-center gap-3">
          {/* Avatar skeleton */}
          <div className="h-8 w-8 rounded-full bg-subtle animate-pulse" />
          {/* Usuario skeleton */}
          <div className="space-y-1">
            <div className="h-4 w-24 bg-subtle rounded animate-pulse" />
            <div className="h-3 w-16 bg-subtle rounded animate-pulse" />
          </div>
        </div>
      </TableCell>

      {/* Nombre */}
      <TableCell>
        <div className="h-4 w-40 bg-subtle rounded animate-pulse" />
      </TableCell>

      {/* Correo */}
      <TableCell>
        <div className="h-4 w-48 bg-subtle rounded animate-pulse" />
      </TableCell>

      {/* Rol */}
      <TableCell>
        <div className="h-6 w-20 bg-subtle rounded-full animate-pulse" />
      </TableCell>

      {/* Estado */}
      <TableCell>
        <div className="h-6 w-16 bg-subtle rounded-full animate-pulse" />
      </TableCell>

      {/* Acciones */}
      <TableCell className="text-right">
        <div className="h-8 w-8 bg-subtle rounded animate-pulse ml-auto" />
      </TableCell>
    </TableRow>
  );
}

/**
 * Skeleton screen para tabla de usuarios con shadcn
 *
 * @example
 * {isLoading && <UsersTableSkeleton />}
 */
export function UsersTableSkeleton({
  rows = 10,
  className,
}: UsersTableSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line-struct overflow-hidden bg-paper",
        className,
      )}
    >
      <Table aria-label="Cargando usuarios...">
        {/* Header */}
        <TableHeader className="bg-subtle">
          <TableRow className="hover:bg-subtle">
            <TableHead className="text-xs font-medium text-txt-muted uppercase tracking-wider">
              Usuario
            </TableHead>
            <TableHead className="text-xs font-medium text-txt-muted uppercase tracking-wider">
              Nombre
            </TableHead>
            <TableHead className="text-xs font-medium text-txt-muted uppercase tracking-wider">
              Correo
            </TableHead>
            <TableHead className="text-xs font-medium text-txt-muted uppercase tracking-wider">
              Rol
            </TableHead>
            <TableHead className="text-xs font-medium text-txt-muted uppercase tracking-wider">
              Estado
            </TableHead>
            <TableHead className="text-right text-xs font-medium text-txt-muted uppercase tracking-wider">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>

        {/* Body con skeleton rows */}
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <SkeletonRow key={index} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
