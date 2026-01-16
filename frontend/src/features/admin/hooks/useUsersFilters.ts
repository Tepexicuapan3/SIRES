/**
 * useUsersFilters - Hook para gestionar estado de filtros de tabla de usuarios
 *
 * ARQUITECTURA:
 * - Centraliza todo el estado de filtros/paginación/búsqueda
 * - Sincroniza con URL query params (compartir links)
 * - Debounce automático en búsqueda (300ms)
 * - Se integra directamente con useUsers() de TanStack Query
 *
 * PATRÓN: Custom Hook with URL State Management
 * - Permite compartir URLs filtradas (ej: /users?page=2&search=juan&rol=1)
 * - Al recargar la página, mantiene los filtros
 *
 * USO:
 * ```tsx
 * const { filters, setSearch, setPage, setRolFilter, setEstadoFilter, resetFilters } = useUsersFilters();
 * const { data, isLoading } = useUsers(filters);
 * ```
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import type { UsersListParams } from "@api/types/users.types";

/**
 * Estado de filtros internos (antes del debounce)
 */
interface FiltersState {
  page: number;
  pageSize: number;
  searchQuery: string; // Input del usuario (inmediato)
  rolId: number | null;
  estado: "A" | "B" | null; // A=Activo, B=Baja, null=Todos
}

/**
 * Resultado del hook con todos los controles
 */
interface UseUsersFiltersReturn {
  filters: UsersListParams; // Listo para pasar a useUsers()
  searchQuery: string; // Valor inmediato de búsqueda (antes del debounce)
  isSearching: boolean; // True mientras espera debounce
  setSearch: (query: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setRolFilter: (rolId: number | null) => void;
  setEstadoFilter: (estado: "A" | "B" | null) => void;
  resetFilters: () => void;
}

/**
 * Hook principal
 */
export const useUsersFilters = (): UseUsersFiltersReturn => {
  // ============================================================
  // URL QUERY PARAMS (Source of Truth)
  // ============================================================

  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Leer valores iniciales desde URL o usar defaults
   */
  const getInitialFilters = (): FiltersState => {
    return {
      page: parseInt(searchParams.get("page") || "1", 10),
      pageSize: parseInt(searchParams.get("page_size") || "20", 10),
      searchQuery: searchParams.get("search") || "",
      rolId: searchParams.get("rol_id")
        ? parseInt(searchParams.get("rol_id")!, 10)
        : null,
      estado: (searchParams.get("estado") as "A" | "B") || null,
    };
  };

  // ============================================================
  // ESTADO LOCAL
  // ============================================================

  /**
   * Estado local de filtros
   *
   * 🔥 ARQUITECTURA CLAVE: Lazy initialization
   * Al pasar una FUNCIÓN en lugar del valor, React solo la ejecuta EN EL MOUNT INICIAL.
   * Esto evita que getInitialFilters() se llame en cada render y sobrescriba el estado.
   *
   * SIN lazy init: useState(getInitialFilters()) ← Se ejecuta en cada render
   * CON lazy init: useState(() => getInitialFilters()) ← Solo en mount
   */
  const [filters, setFilters] = useState<FiltersState>(() =>
    getInitialFilters(),
  );

  /**
   * Búsqueda con debounce (espera 300ms después de que el usuario deja de escribir)
   * Esto evita hacer requests por cada tecla presionada
   */
  const debouncedSearch = useDebounce(filters.searchQuery, 300);

  /**
   * Indicador de que estamos esperando el debounce
   */
  const isSearching = filters.searchQuery !== debouncedSearch;

  // ============================================================
  // SINCRONIZAR ESTADO → URL
  // ============================================================

  /**
   * Cada vez que cambia el estado local, actualizar URL
   * Esto permite:
   * - Compartir links filtrados
   * - Historial del navegador funcional (back/forward mantiene filtros)
   * - Reload preserva filtros
   */
  useEffect(() => {
    const params = new URLSearchParams();

    // Solo agregar params que NO sean defaults (URL limpia)
    if (filters.page !== 1) params.set("page", filters.page.toString());
    if (filters.pageSize !== 20)
      params.set("page_size", filters.pageSize.toString());
    if (debouncedSearch) params.set("search", debouncedSearch); // ✅ Consistente: "search" en URL y API
    if (filters.rolId !== null) params.set("rol_id", filters.rolId.toString());
    if (filters.estado !== null) params.set("estado", filters.estado);

    // Actualizar URL sin recargar la página
    setSearchParams(params, { replace: true });
  }, [
    filters.page,
    filters.pageSize,
    debouncedSearch,
    filters.rolId,
    filters.estado,
    setSearchParams,
  ]);

  // ============================================================
  // FILTROS FINALES (Para TanStack Query)
  // ============================================================

  /**
   * Objeto final listo para pasar a useUsers(params)
   * Usa el valor debouncado de búsqueda
   */
  const finalFilters: UsersListParams = useMemo(() => {
    const params: UsersListParams = {
      page: filters.page,
      page_size: filters.pageSize,
    };

    // Solo agregar params opcionales si tienen valor
    if (debouncedSearch) params.search = debouncedSearch; // ✅ FIX: Backend espera "search", no "search_query"
    if (filters.rolId !== null) params.rol_id = filters.rolId;
    if (filters.estado !== null) params.estado = filters.estado;

    return params;
  }, [
    filters.page,
    filters.pageSize,
    debouncedSearch,
    filters.rolId,
    filters.estado,
  ]);

  // ============================================================
  // SETTERS (API del hook)
  // ============================================================

  /**
   * Actualizar búsqueda
   * Al cambiar búsqueda, resetear página a 1
   *
   * 🔥 IMPORTANTE: Envuelto en useCallback para que sea ESTABLE.
   * Sin esto, componentes que usen este setter en useEffect
   * se ejecutarían en cada render (causa loops infinitos).
   */
  const setSearch = useCallback((query: string) => {
    setFilters((prev) => ({
      ...prev,
      searchQuery: query,
      page: 1, // Siempre volver a página 1 al buscar
    }));
  }, []); // Deps vacías: setFilters es estable

  /**
   * Cambiar página
   */
  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  /**
   * Cambiar tamaño de página
   * Al cambiar pageSize, resetear a página 1
   */
  const setPageSize = useCallback((size: number) => {
    setFilters((prev) => ({
      ...prev,
      pageSize: size,
      page: 1,
    }));
  }, []);

  /**
   * Filtrar por rol
   */
  const setRolFilter = useCallback((rolId: number | null) => {
    setFilters((prev) => ({
      ...prev,
      rolId,
      page: 1, // Resetear paginación al filtrar
    }));
  }, []);

  /**
   * Filtrar por estado (Activo/Inactivo)
   */
  const setEstadoFilter = useCallback((estado: "A" | "B" | null) => {
    setFilters((prev) => ({
      ...prev,
      estado,
      page: 1, // Resetear paginación al filtrar
    }));
  }, []);

  /**
   * Resetear todos los filtros a valores default
   */
  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      pageSize: 20,
      searchQuery: "",
      rolId: null,
      estado: null,
    });
  }, []);

  // ============================================================
  // RETURN
  // ============================================================

  return {
    filters: finalFilters,
    searchQuery: filters.searchQuery, // Valor inmediato (antes del debounce)
    isSearching,
    setSearch,
    setPage,
    setPageSize,
    setRolFilter,
    setEstadoFilter,
    resetFilters,
  };
};
