import { type ReactNode } from "react";
import { TableFilters } from "@features/admin/shared/components/TableFilters";

export interface TableHeaderBarProps {
  search?: ReactNode;
  actions?: ReactNode;
}

export function TableHeaderBar({ search, actions }: TableHeaderBarProps) {
  return (
    <TableFilters align="between">
      <div>{search}</div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {actions}
      </div>
    </TableFilters>
  );
}
