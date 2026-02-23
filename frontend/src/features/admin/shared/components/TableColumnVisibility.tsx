import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TableColumnVisibilityItem {
  key: string;
  label: string;
  canHide?: boolean;
}

export type ColumnVisibilityState = Record<string, boolean>;

export interface TableColumnVisibilityProps {
  columns: TableColumnVisibilityItem[];
  visibility: ColumnVisibilityState;
  onVisibilityChange: (next: ColumnVisibilityState) => void;
  label?: string;
}

export function TableColumnVisibility({
  columns,
  visibility,
  onVisibilityChange,
  label = "Columnas",
}: TableColumnVisibilityProps) {
  const hiddenCount = columns.reduce((count, column) => {
    const isVisible = visibility[column.key] ?? true;
    return isVisible ? count : count + 1;
  }, 0);

  const handleToggle = (key: string, isVisible: boolean) => {
    onVisibilityChange({
      ...visibility,
      [key]: isVisible,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Columns3 className="size-4" />
          {label}
          {hiddenCount > 0 ? (
            <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full border-2 border-line-struct text-[10px] font-bold leading-none text-txt-body">
              {hiddenCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel className="text-xs text-txt-muted tracking-wide">
          Columnas visibles
        </DropdownMenuLabel>
        {columns.map((column) => {
          const canHide = column.canHide ?? true;
          const isVisible = visibility[column.key] ?? true;

          return (
            <DropdownMenuCheckboxItem
              key={column.key}
              checked={isVisible}
              disabled={!canHide}
              onCheckedChange={(checked) => {
                handleToggle(column.key, Boolean(checked));
              }}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
