/**
 * ============================================
 * COMPONENTE: UsersTableToolbar (DISEÑO AVANZADO)
 * ============================================
 *
 * Toolbar profesional con filtros avanzados y badges activos.
 *
 * **CARACTERÍSTICAS:**
 * 1. ✅ Estado: Solo permite seleccionar UNO (radio behavior)
 * 2. ✅ Roles: Permite seleccionar MÚLTIPLES (checkbox behavior)
 * 3. ✅ Badges activos: Muestra filtros aplicados debajo del toolbar
 * 4. ✅ Diseño limpio sin Card wrapper
 * 5. ✅ Input de búsqueda con componente Input de shadcn
 *
 * **Arquitectura de Búsqueda:**
 * - Usuario tipea → setSearch() del hook (inmediato)
 * - Hook maneja debounce (300ms) internamente
 * - TanStack Query detecta cambio → API request
 */

import { useState, useEffect } from "react";
import { Search, Plus, X, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUsersFilters } from "../../hooks/useUsersFilters";
import { cn } from "@/lib/utils";

export interface UsersTableToolbarProps {
  /** Callback al hacer clic en "Crear Usuario" */
  onCreateUser: () => void;
  /** Clase CSS adicional para el container */
  className?: string;
  /** Hook de filtros pasado desde el padre (SINGLE SOURCE OF TRUTH) */
  filtersHook: ReturnType<typeof useUsersFilters>;
}

/**
 * Opciones de filtros (constantes)
 */
const ESTADO_OPTIONS = [
  { value: "A", label: "Activo" },
  { value: "B", label: "Inactivo" },
] as const;

const ROL_OPTIONS = [
  { value: 1, label: "Admin" },
  { value: 2, label: "Médico" },
  { value: 3, label: "Enfermero" },
  { value: 4, label: "Recepción" },
] as const;

/**
 * Componente principal del toolbar
 */
export const UsersTableToolbar: React.FC<UsersTableToolbarProps> = ({
  onCreateUser,
  className,
  filtersHook,
}) => {
  // ============================================================
  // HOOKS - STATE MANAGEMENT
  // ============================================================

  const {
    filters,
    searchQuery,
    setSearch,
    setEstadoFilter,
    setRolFilter,
    resetFilters,
  } = filtersHook;

  // Estado local para múltiples roles seleccionados
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  // Sincronizar selectedRoles cuando filters.rol_id cambia a null
  // Esto maneja el caso cuando se limpia desde el hook (resetFilters)
  useEffect(() => {
    if (filters.rol_id === null && selectedRoles.length > 0) {
      setSelectedRoles([]);
    }
  }, [filters.rol_id, selectedRoles.length]);

  // ============================================================
  // COMPUTED STATE
  // ============================================================

  // Filtros activos (sin contar búsqueda)
  const hasActiveFilters = filters.estado !== null || selectedRoles.length > 0;

  // DEBUG: Logs temporales
  console.log("🔍 DEBUG Toolbar:", {
    "filters.estado": filters.estado,
    selectedRoles: selectedRoles,
    "selectedRoles.length": selectedRoles.length,
    hasActiveFilters: hasActiveFilters,
  });

  // Contador de filtros activos (para badges)
  const activeFiltersCount =
    (filters.estado !== null ? 1 : 0) + selectedRoles.length;

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  /**
   * Toggle de estado (RADIO: solo permite uno)
   * Si clickea el mismo estado que ya está activo, lo deselecciona
   */
  const handleToggleEstado = (value: "A" | "B") => {
    if (filters.estado === value) {
      setEstadoFilter(null); // Deseleccionar
    } else {
      setEstadoFilter(value); // Seleccionar nuevo
    }
  };

  /**
   * Toggle de rol (CHECKBOX: permite múltiples)
   */
  const handleToggleRol = (value: number) => {
    const newRoles = selectedRoles.includes(value)
      ? selectedRoles.filter((r) => r !== value) // Remover
      : [...selectedRoles, value]; // Agregar

    setSelectedRoles(newRoles);

    // Actualizar el filtro con el primer rol (por compatibilidad con backend)
    // TODO: Adaptar backend para aceptar múltiples roles
    if (newRoles.length > 0) {
      setRolFilter(newRoles[0]);
    } else {
      setRolFilter(null);
    }
  };

  const handleClearFilters = () => {
    setSelectedRoles([]);
    resetFilters();
  };

  // Remover rol individual desde badge
  const handleRemoveRol = (roleId: number) => {
    const newRoles = selectedRoles.filter((r) => r !== roleId);
    setSelectedRoles(newRoles);

    if (newRoles.length > 0) {
      setRolFilter(newRoles[0]);
    } else {
      setRolFilter(null);
    }
  };

  // Obtener label del estado actual
  const estadoLabel = filters.estado
    ? ESTADO_OPTIONS.find((opt) => opt.value === filters.estado)?.label
    : null;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* TOOLBAR PRINCIPAL */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* SECCIÓN IZQUIERDA: Búsqueda + Filtros */}
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          {/* Input de búsqueda */}
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-muted" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 bg-paper border-line-struct focus-visible:ring-brand"
            />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro de Estado (RADIO: solo uno) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-line-struct hover:bg-subtle hover:text-txt-body"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Estado
                  {filters.estado && (
                    <span className="ml-1.5 text-xs font-medium text-brand">
                      1
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-48 bg-paper border-line-struct"
              >
                <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ESTADO_OPTIONS.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={filters.estado === option.value}
                    onCheckedChange={() => handleToggleEstado(option.value)}
                    className="cursor-pointer"
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Filtro de Rol (CHECKBOX: múltiples) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-line-struct hover:bg-subtle hover:text-txt-body"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Rol
                  {selectedRoles.length > 0 && (
                    <span className="ml-1.5 text-xs font-medium text-brand">
                      {selectedRoles.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-48 bg-paper border-line-struct"
              >
                <DropdownMenuLabel>Filtrar por rol</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ROL_OPTIONS.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={selectedRoles.includes(option.value)}
                    onCheckedChange={() => handleToggleRol(option.value)}
                    className="cursor-pointer"
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Botón Limpiar Filtros - SOLO cuando hay filtros */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-9 px-2 lg:px-3 text-txt-muted hover:text-txt-body"
              >
                Limpiar
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* SECCIÓN DERECHA: Botón Crear Usuario */}
        <Button
          onClick={onCreateUser}
          size="sm"
          className="h-9 bg-brand text-white hover:bg-brand/90 shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Crear Usuario
        </Button>
      </div>

      {/* BADGES DE FILTROS ACTIVOS */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-txt-muted">Filtros activos:</span>

          {/* Badge de Estado */}
          {filters.estado && estadoLabel && (
            <Badge
              variant="secondary"
              className="bg-brand/10 text-brand border-brand/20"
            >
              Estado: {estadoLabel}
              <button
                onClick={() => setEstadoFilter(null)}
                className="ml-1 hover:text-brand-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {/* Badges de Roles */}
          {selectedRoles.map((roleId) => {
            const roleLabel = ROL_OPTIONS.find(
              (r) => r.value === roleId,
            )?.label;
            return (
              <Badge
                key={roleId}
                variant="secondary"
                className="bg-brand/10 text-brand border-brand/20"
              >
                Rol: {roleLabel}
                <button
                  onClick={() => handleRemoveRol(roleId)}
                  className="ml-1 hover:text-brand-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};
