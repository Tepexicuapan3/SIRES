/**
 * ============================================
 * COMPONENTE: UsersDataTable
 * ============================================
 *
 * Tabla completa de gestión de usuarios con todos los estados y funcionalidad.
 *
 * **Decisión de Diseño:**
 * - Integra TODOS los componentes: Toolbar, Header, Rows, Pagination, Skeleton
 * - Maneja todos los edge cases: loading, error, empty, no results
 * - Single responsibility: este componente SOLO renderiza, la lógica está en hooks
 * - Composition over configuration: combina componentes pequeños en lugar de props gigantes
 *
 * **Patrón Aplicado:**
 * - Container component: orquesta sub-componentes y hooks
 * - State machine: loading → error/success → empty/data
 * - Optimistic UI: toast con undo para acciones no-críticas
 * - Error boundaries: retry en caso de error
 *
 * **Estados Manejados:**
 * 1. Loading → UsersTableSkeleton
 * 2. Error → Error state con botón retry
 * 3. Success + Empty (no hay usuarios) → Empty state
 * 4. Success + No results (búsqueda sin resultados) → No results state
 * 5. Success + Data → Tabla con datos
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, SearchX, UserX, RefreshCcw, Users } from "lucide-react";
import { useUsers } from "../../hooks/useAdminUsers";
import { useUsersFilters } from "../../hooks/useUsersFilters";
import { useToastActions } from "../../hooks/useToastActions";
import { usersAPI } from "@api/resources/users.api";
import { UsersTableRow } from "./UsersTableRow";
import { UsersTableSkeleton } from "./UsersTableSkeleton";
import { UsersTablePagination } from "./UsersTablePagination";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { User } from "@api/types";

export interface UsersDataTableProps {
  /** Callback cuando se hace click en "Ver Detalle" */
  onViewDetail?: (userId: number) => void;
  /** Callback cuando se hace click en "Editar" */
  onEdit?: (userId: number) => void;
  /** Clase CSS adicional para el container */
  className?: string;
  /** Hook de filtros pasado desde el padre (SINGLE SOURCE OF TRUTH) */
  filtersHook: ReturnType<typeof useUsersFilters>;
}

/**
 * Tabla completa de usuarios con todos los estados
 *
 * **Integración:**
 * - `useUsersFilters()` - Estado de filtros/búsqueda/paginación (sincronizado con URL)
 * - `useUsers(filters)` - TanStack Query para obtener datos
 * - `useActivateUser()` / `useDeactivateUser()` - Mutaciones para cambiar estado
 * - `useToastActions()` - Notificaciones con undo actions
 *
 * **Edge Cases Manejados:**
 * - Loading: Skeleton screen con estructura real de tabla
 * - Error: Mensaje descriptivo + botón "Reintentar"
 * - Empty (sin filtros): "No hay usuarios" + sugerencia crear primero
 * - No results (con filtros): "No se encontraron resultados" + botón limpiar filtros
 * - Success: Tabla con datos + paginación
 *
 * @example
 * // Uso básico con state machine (UsersPage)
 * <div className="space-y-4">
 *   <UsersTableToolbar onCreateUser={() => setShowCreate(true)} />
 *   <UsersDataTable onViewDetail={handleViewDetails} />
 * </div>
 *
 * @example
 * // Uso standalone (navega a ruta)
 * <UsersDataTable />
 */
export function UsersDataTable({
  onViewDetail,
  onEdit,
  className,
  filtersHook,
}: UsersDataTableProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ============================================================
  // HOOKS - STATE MANAGEMENT
  // ============================================================

  /**
   * Destructurar hook recibido como prop (en lugar de llamarlo acá)
   *
   * ✅ FIX: Ahora el hook se llama UNA SOLA VEZ en UsersPage
   * y se pasa como prop a todos los componentes que lo necesitan.
   */
  const { filters, setPage, resetFilters } = filtersHook;

  /**
   * TanStack Query - obtener usuarios con filtros
   * Cache automático, refetch en background, etc.
   */
  const { data, isLoading, isError, error, refetch } = useUsers(filters);

  /**
   * Toasts con undo actions
   */
  const {
    showActivateToast,
    showDeactivateToast,
    showErrorToast,
    showUserErrorToast,
  } = useToastActions();

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  /**
   * Ver detalle del usuario
   * Si se provee onViewDetail prop, lo usa (para state machine en UsersPage)
   * Si no, navega a la ruta de detalle (para uso standalone)
   */
  const handleViewDetail = useCallback(
    (userId: number) => {
      if (onViewDetail) {
        onViewDetail(userId);
      } else {
        navigate(`/admin/users/${userId}`);
      }
    },
    [onViewDetail, navigate],
  );

  /**
   * Editar usuario
   * Si se provee onEdit prop, lo usa (para state machine en UsersPage)
   * Si no, navega a la ruta de edición (para uso standalone)
   */
  const handleEdit = useCallback(
    (userId: number) => {
      if (onEdit) {
        onEdit(userId);
      } else {
        navigate(`/admin/users/${userId}/edit`);
      }
    },
    [onEdit, navigate],
  );

  /**
   * Cambiar estado del usuario (Activar/Desactivar)
   *
   * **Flujo:**
   * 1. Determina acción (activar o desactivar) según estado actual
   * 2. Ejecuta mutación correspondiente usando usersAPI directamente
   * 3. Invalida cache manualmente (queryClient)
   * 4. Muestra toast con undo action
   *
   * **UX:**
   * - Optimistic update: UI cambia inmediatamente
   * - Undo disponible por 5 segundos
   * - Si falla, muestra error y revierte cambio
   */
  const handleToggleStatus = useCallback(
    async (userId: number, currentStatus: string) => {
      // Encontrar el usuario en el cache actual (para mostrar nombre en toast)
      const user = data?.items.find((u) => u.id_usuario === userId);
      if (!user) return;

      try {
        if (currentStatus === "A") {
          // Usuario activo → desactivar
          await usersAPI.deactivateUser(userId);

          // Invalidar cache
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["user", userId] });

          // Toast con undo (reactivar)
          showDeactivateToast(user, async () => {
            await usersAPI.activateUser(userId);
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["user", userId] });
          });
        } else {
          // Usuario inactivo → activar
          await usersAPI.activateUser(userId);

          // Invalidar cache
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["user", userId] });

          // Toast con undo (desactivar de nuevo)
          showActivateToast(user, async () => {
            await usersAPI.deactivateUser(userId);
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["user", userId] });
          });
        }
      } catch (err) {
        // Error al cambiar estado
        const action = currentStatus === "A" ? "desactivar" : "activar";
        showUserErrorToast(action, user, err);
      }
    },
    [
      data?.items,
      queryClient,
      showActivateToast,
      showDeactivateToast,
      showUserErrorToast,
    ],
  );

  /**
   * Reintentar carga (en caso de error)
   */
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  /**
   * Limpiar filtros (cuando no hay resultados de búsqueda)
   */
  const handleClearFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  // ============================================================
  // COMPUTED STATE
  // ============================================================

  /**
   * Determinar si hay filtros activos (búsqueda, rol, estado)
   * Usado para distinguir "empty state" vs "no results"
   */
  const hasActiveFilters = !!(
    filters.search ||
    filters.rol_id ||
    filters.estado
  );

  /**
   * Estado de la tabla (state machine)
   */
  const isEmpty = data?.items.length === 0;
  const hasNoResults = isEmpty && hasActiveFilters;
  const isEmptyInitial = isEmpty && !hasActiveFilters;

  // ============================================================
  // RENDER - LOADING STATE
  // ============================================================

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <UsersTableSkeleton rows={filters.page_size || 20} />
      </div>
    );
  }

  // ============================================================
  // RENDER - ERROR STATE
  // ============================================================

  if (isError) {
    return (
      <div
        className={cn(
          "rounded-lg border border-line-struct bg-paper p-12",
          className,
        )}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {/* Ícono de error */}
          <div className="rounded-full bg-status-critical/10 p-4">
            <AlertCircle className="h-10 w-10 text-status-critical" />
          </div>

          {/* Mensaje de error */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-txt-body">
              Error al cargar usuarios
            </h3>
            <p className="text-sm text-txt-muted max-w-md">
              {error instanceof Error
                ? error.message
                : "Ocurrió un error al obtener la lista de usuarios. Por favor intentá de nuevo."}
            </p>
          </div>

          {/* Botón reintentar */}
          <Button
            variant="outline"
            onClick={handleRetry}
            className="gap-2"
            aria-label="Reintentar carga de usuarios"
          >
            <RefreshCcw className="h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER - EMPTY STATE (sin filtros, no hay usuarios creados)
  // ============================================================

  if (isEmptyInitial) {
    return (
      <div
        className={cn(
          "rounded-lg border border-line-struct bg-paper p-12",
          className,
        )}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {/* Ícono de empty */}
          <div className="rounded-full bg-subtle p-4">
            <UserX className="h-10 w-10 text-txt-muted" />
          </div>

          {/* Mensaje */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-txt-body">
              No hay usuarios registrados
            </h3>
            <p className="text-sm text-txt-muted max-w-md">
              Empezá creando el primer usuario del sistema usando el botón
              "Crear Usuario" arriba.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER - NO RESULTS (con filtros, pero no hay coincidencias)
  // ============================================================

  if (hasNoResults) {
    return (
      <div
        className={cn(
          "rounded-lg border border-line-struct bg-paper p-12",
          className,
        )}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {/* Ícono de búsqueda sin resultados */}
          <div className="rounded-full bg-subtle p-4">
            <SearchX className="h-10 w-10 text-txt-muted" />
          </div>

          {/* Mensaje */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-txt-body">
              No se encontraron resultados
            </h3>
            <p className="text-sm text-txt-muted max-w-md">
              Intentá ajustar los filtros de búsqueda o limpiarlos para ver
              todos los usuarios.
            </p>
          </div>

          {/* Botón limpiar filtros */}
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="gap-2"
            aria-label="Limpiar filtros de búsqueda"
          >
            <RefreshCcw className="h-4 w-4" />
            Limpiar Filtros
          </Button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER - SUCCESS STATE (con datos)
  // ============================================================

  return (
    <div className={cn("space-y-4", className)}>
      {/* TABLA CON SHADCN */}
      <div className="rounded-lg border border-line-struct overflow-hidden bg-paper">
        <Table>
          {/* HEADER */}
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

          {/* BODY */}
          <TableBody>
            {data?.items.map((user: User) => (
              <UsersTableRow
                key={user.id_usuario}
                user={user}
                onViewDetail={handleViewDetail}
                onEdit={handleEdit}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </TableBody>
        </Table>

        {/* PAGINACIÓN */}
        {data && data.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-line-struct bg-subtle">
            <UsersTablePagination
              currentPage={data.page}
              totalPages={data.total_pages}
              pageSize={data.page_size}
              totalItems={data.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Info adicional (solo si hay un solo resultado o página única) */}
      {data && data.total_pages === 1 && data.total > 0 && (
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-2 text-sm text-txt-muted">
            <Users className="h-4 w-4" />
            <span>
              Mostrando {data.total} {data.total === 1 ? "usuario" : "usuarios"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
