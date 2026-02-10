import { type ReactNode } from "react";
import { TableFilters } from "@features/admin/shared/components/TableFilters";

export interface TableHeaderBarProps {
  search?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function TableHeaderBar({
  search,
  actions,
  className,
}: TableHeaderBarProps) {
  const align = search && actions ? "between" : actions ? "end" : "start";

  return (
    <TableFilters align={align} className={className}>
      {search ? (
        <div className="flex w-full min-w-0 sm:flex-1">{search}</div>
      ) : null}
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </TableFilters>
  );
}
