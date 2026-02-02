import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZES = [10, 20, 50] as const;

type PaginationToken = number | "ellipsis";

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

const buildPaginationItems = (
  page: number,
  totalPages: number,
): PaginationToken[] => {
  if (totalPages <= 1) {
    return [1];
  }

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  pages.add(page);
  pages.add(page - 1);
  pages.add(page + 1);

  const ordered = Array.from(pages)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const result: PaginationToken[] = [];
  ordered.forEach((value, index) => {
    if (index === 0) {
      result.push(value);
      return;
    }

    const previous = ordered[index - 1] ?? 0;
    if (value - previous > 1) {
      result.push("ellipsis");
    }
    result.push(value);
  });

  return result;
};

const getRangeLabel = (page: number, pageSize: number, total: number) => {
  if (total === 0) {
    return "Mostrando 0 resultados";
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return `Mostrando ${start}-${end} de ${total}`;
};

export function TablePagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [...DEFAULT_PAGE_SIZES],
  className,
}: TablePaginationProps) {
  const items = buildPaginationItems(page, totalPages);
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

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
        "flex w-full flex-col gap-4 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="text-sm text-txt-muted">
        {getRangeLabel(page, pageSize, total)}
      </div>
      {onPageSizeChange ? (
        <div className="flex items-center gap-2 text-sm text-txt-muted">
          <span>Filas por pagina</span>
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
      <Pagination className="md:mx-0 md:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              href="#"
              size="default"
              onClick={(event) => {
                event.preventDefault();
                handlePageChange(page - 1);
              }}
              aria-disabled={isFirstPage}
              className={cn(isFirstPage && "pointer-events-none opacity-50")}
            >
              Anterior
            </PaginationLink>
          </PaginationItem>
          {items.map((item, index) =>
            item === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={`page-${item}`}>
                <PaginationLink
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    handlePageChange(item);
                  }}
                  isActive={item === page}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationLink
              href="#"
              size="default"
              onClick={(event) => {
                event.preventDefault();
                handlePageChange(page + 1);
              }}
              aria-disabled={isLastPage}
              className={cn(isLastPage && "pointer-events-none opacity-50")}
            >
              Siguiente
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
