/**
 * ============================================
 * COMPONENTE: UsersTablePagination (SHADCN)
 * ============================================
 *
 * Paginación profesional usando primitivos de shadcn/ui adaptados a Metro CDMX.
 *
 * **Decisión de Diseño:**
 * - Usa componentes shadcn <Pagination> como base
 * - Adapta estilos a tokens Metro CDMX
 * - Mantiene accesibilidad completa (ARIA labels, keyboard nav)
 * - Responsive: full controls en desktop, minimal en mobile
 *
 * **Patrón Aplicado:**
 * - Composition: Construye con primitivos shadcn
 * - Controlled component: recibe page/total y emite onChange
 */

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UsersTablePaginationProps {
  /** Página actual (1-indexed) */
  currentPage: number;
  /** Total de páginas */
  totalPages: number;
  /** Total de items */
  totalItems: number;
  /** Items por página */
  pageSize: number;
  /** Callback al cambiar de página */
  onPageChange: (page: number) => void;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Componente de paginación adaptado a Metro CDMX
 *
 * Muestra:
 * - Botones Previous/Next
 * - Números de página (con ellipsis si hay muchos)
 * - Info: "Mostrando X-Y de Z usuarios"
 *
 * @example
 * <UsersTablePagination
 *   currentPage={2}
 *   totalPages={10}
 *   totalItems={195}
 *   pageSize={20}
 *   onPageChange={setPage}
 * />
 */
export function UsersTablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: UsersTablePaginationProps) {
  // ============================================================
  // COMPUTED STATE
  // ============================================================

  /**
   * Rango de items mostrados en la página actual
   * Ejemplo: Página 2, pageSize 20 → "Mostrando 21-40 de 195"
   */
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  /**
   * Páginas a mostrar (solo mostrar 5 números max)
   * Ejemplo: [1, 2, 3, 4, 5] o [1, ..., 8, 9, 10]
   */
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      // Mostrar todos los números si son 7 o menos
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Siempre mostrar primera y última página
    const pages: (number | "ellipsis")[] = [];

    if (currentPage <= 3) {
      // Usuario está cerca del inicio
      pages.push(1, 2, 3, 4, "ellipsis", totalPages);
    } else if (currentPage >= totalPages - 2) {
      // Usuario está cerca del final
      pages.push(
        1,
        "ellipsis",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      );
    } else {
      // Usuario está en el medio
      pages.push(
        1,
        "ellipsis",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "ellipsis",
        totalPages,
      );
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    onPageChange(page);
  };

  // ============================================================
  // RENDER
  // ============================================================

  // No mostrar paginación si solo hay 1 página o menos
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {/* INFO: Mostrando X-Y de Z */}
      <div className="text-sm text-txt-muted text-center sm:text-left">
        Mostrando{" "}
        <span className="font-medium text-txt-body">
          {startItem}-{endItem}
        </span>{" "}
        de <span className="font-medium text-txt-body">{totalItems}</span>{" "}
        usuario{totalItems !== 1 ? "s" : ""}
      </div>

      {/* CONTROLES DE PAGINACIÓN */}
      <Pagination>
        <PaginationContent>
          {/* PREVIOUS BUTTON */}
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="gap-1 px-2.5"
              aria-label="Ir a la página anterior"
            >
              <ChevronLeft className="size-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
          </PaginationItem>

          {/* PAGE NUMBERS */}
          <div className="hidden sm:flex sm:items-center sm:gap-1">
            {pageNumbers.map((pageNum, idx) =>
              pageNum === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={pageNum}>
                  <Button
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handlePageClick(pageNum)}
                    className={cn(
                      "min-w-9 px-3",
                      currentPage === pageNum &&
                        "bg-brand text-txt-inverse hover:bg-brand-hover",
                    )}
                    aria-label={`Ir a la página ${pageNum}`}
                    aria-current={currentPage === pageNum ? "page" : undefined}
                  >
                    {pageNum}
                  </Button>
                </PaginationItem>
              ),
            )}
          </div>

          {/* MOBILE: Página X de Y */}
          <div className="flex sm:hidden items-center px-2 text-sm text-txt-muted">
            <span className="font-medium text-txt-body">{currentPage}</span>
            <span className="mx-1">/</span>
            <span>{totalPages}</span>
          </div>

          {/* NEXT BUTTON */}
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="gap-1 px-2.5"
              aria-label="Ir a la página siguiente"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="size-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
