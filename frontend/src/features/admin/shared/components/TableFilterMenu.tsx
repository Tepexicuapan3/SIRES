import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TableFilterOption {
  id: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export interface TableFilterSection {
  id: string;
  label: string;
  options: TableFilterOption[];
}

export interface TableFilterMenuProps {
  sections: TableFilterSection[];
  appliedCount: number;
  onClear?: () => void;
}

export function TableFilterMenu({
  sections,
  appliedCount,
  onClear,
}: TableFilterMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="size-4" />
          Filtros
          {appliedCount > 0 ? (
            <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-contrast text-xs font-semibold text-txt-contrast">
              {appliedCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {sections.map((section, index) => (
          <div key={section.id}>
            <DropdownMenuLabel className="text-xs text-txt-muted tracking-wide">
              {section.label}
            </DropdownMenuLabel>
            {section.options.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.id}
                checked={option.selected}
                onCheckedChange={(checked) => {
                  if (!checked) return;
                  option.onSelect();
                }}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
            {index < sections.length - 1 ? <DropdownMenuSeparator /> : null}
          </div>
        ))}
        {appliedCount > 0 && onClear ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onClear}>
              <X className="size-4" />
              Limpiar filtros
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
