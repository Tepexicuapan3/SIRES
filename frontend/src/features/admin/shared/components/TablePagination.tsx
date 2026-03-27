import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@shared/ui/pagination";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { cn } from "@shared/utils/styling/cn";

const DEFAULT_PAGE_SIZES = [10, 20, 50] as const;

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function TablePagination({
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [...DEFAULT_PAGE_SIZES],
  className,
}: TablePaginationProps) {
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;
  const showPageSize = Boolean(onPageSizeChange);
  const navButtonClassName =
    "border border-line-struct bg-paper text-txt-body hover:bg-subtle hover:border-line-struct/80";

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page || nextPage < 1 || nextPage > totalPages) {
      return;
    }
    onPageChange(nextPage);
  };

  const handleSelect = (value: string) => {
    const nextPageSize = Number(value);
    if (!Number.isFinite(nextPageSize) || nextPageSize <= 0) {
      return;
    }
    onPageSizeChange?.(nextPageSize);
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 sm:flex-row sm:items-center",
        showPageSize ? "sm:justify-between" : "sm:justify-end",
        className,
      )}
    >
      {onPageSizeChange ? (
        <div className="flex w-full items-center gap-2 text-xs text-txt-muted sm:w-auto sm:text-sm">
          <span className="whitespace-nowrap">Filas por pagina</span>
          <Select value={pageSize.toString()} onValueChange={handleSelect}>
            <SelectTrigger className="h-8 w-22.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <Pagination className="mx-0 w-full justify-end sm:w-auto">
        <PaginationContent className="w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          <PaginationItem>
            <PaginationLink
              href="#"
              size="icon-sm"
              onClick={(event) => {
                event.preventDefault();
                handlePageChange(1);
              }}
              aria-disabled={isFirstPage}
              className={cn(
                navButtonClassName,
                isFirstPage && "pointer-events-none opacity-50",
              )}
            >
              <ChevronsLeft className="size-4" />
              <span className="sr-only">Primera pagina</span>
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              size="icon-sm"
              onClick={(event) => {
                event.preventDefault();
                handlePageChange(page - 1);
              }}
              aria-disabled={isFirstPage}
              className={cn(
                navButtonClassName,
                isFirstPage && "pointer-events-none opacity-50",
              )}
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">Pagina anterior</span>
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <span className="px-1 text-xs text-txt-muted sm:text-sm sm:whitespace-nowrap">
              Pagina {page} de {totalPages}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              size="icon-sm"
              onClick={(event) => {
                event.preventDefault();
                handlePageChange(page + 1);
              }}
              aria-disabled={isLastPage}
              className={cn(
                navButtonClassName,
                isLastPage && "pointer-events-none opacity-50",
              )}
            >
              <ChevronRight className="size-4" />
              <span className="sr-only">Pagina siguiente</span>
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              size="icon-sm"
              onClick={(event) => {
                event.preventDefault();
                handlePageChange(totalPages);
              }}
              aria-disabled={isLastPage}
              className={cn(
                navButtonClassName,
                isLastPage && "pointer-events-none opacity-50",
              )}
            >
              <ChevronsRight className="size-4" />
              <span className="sr-only">Ultima pagina</span>
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
