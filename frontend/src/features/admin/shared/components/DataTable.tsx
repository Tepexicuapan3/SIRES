import { type ReactNode } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  TablePagination,
  type TablePaginationProps,
} from "@features/admin/shared/components/TablePagination";

const COLUMN_ALIGN = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

type ColumnAlign = keyof typeof COLUMN_ALIGN;

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  accessorKey?: keyof T & string;
  render?: (row: T) => ReactNode;
  align?: ColumnAlign;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  isLoading?: boolean;
  loadingRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  pagination?: TablePaginationProps;
  footerNote?: ReactNode;
  getRowKey?: (row: T, index: number) => string;
  className?: string;
}

const defaultEmptyTitle = "Sin resultados";
const defaultEmptyDescription = "No hay registros para mostrar";

export function DataTable<T>({
  columns,
  rows,
  isLoading = false,
  loadingRows = 6,
  emptyTitle = defaultEmptyTitle,
  emptyDescription = defaultEmptyDescription,
  pagination,
  footerNote,
  getRowKey,
  className,
}: DataTableProps<T>) {
  return (
    <Card className={className}>
      <CardContent>
        {isLoading ? (
          <Table>
            <TableHeader className="bg-subtle">
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "text-xs font-medium text-txt-muted uppercase tracking-wider",
                      COLUMN_ALIGN[column.align ?? "left"],
                      column.headerClassName,
                    )}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: loadingRows }).map((_, rowIndex) => (
                <TableRow key={`loading-${rowIndex}`}>
                  {columns.map((column) => (
                    <TableCell key={`${column.key}-${rowIndex}`}>
                      <div className="h-4 w-full animate-pulse rounded bg-subtle" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-line-struct bg-paper p-10 text-center">
            <h3 className="text-lg font-semibold text-txt-body">
              {emptyTitle}
            </h3>
            <p className="mt-2 text-sm text-txt-muted">{emptyDescription}</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-subtle">
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "text-xs font-medium text-txt-muted uppercase tracking-wider",
                      COLUMN_ALIGN[column.align ?? "left"],
                      column.headerClassName,
                    )}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => {
                const rowKey = getRowKey
                  ? getRowKey(row, rowIndex)
                  : `row-${rowIndex}`;

                return (
                  <TableRow key={rowKey} className="hover:bg-subtle/50">
                    {columns.map((column) => {
                      const dataKey =
                        column.accessorKey ?? (column.key as keyof T);
                      const content = column.render
                        ? column.render(row)
                        : ((row[dataKey] as ReactNode) ?? "—");

                      return (
                        <TableCell
                          key={`${column.key}-${rowKey}`}
                          className={cn(
                            COLUMN_ALIGN[column.align ?? "left"],
                            column.className,
                          )}
                        >
                          {content}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {pagination ? (
        <CardFooter className="flex flex-col gap-4 border-t border-line-struct md:flex-row md:items-center md:justify-between">
          <TablePagination {...pagination} />
          {footerNote ? (
            <div className="text-xs text-txt-muted">{footerNote}</div>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}
