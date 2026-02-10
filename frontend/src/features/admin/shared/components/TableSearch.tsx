import { type ChangeEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

export function TableSearch({
  value,
  onChange,
  placeholder = "Buscar",
  disabled = false,
  className,
  inputClassName,
}: TableSearchProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div
      className={cn(
        "relative w-full min-w-0 sm:max-w-xs lg:max-w-sm",
        className,
      )}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-txt-muted" />
      <Input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "h-9 rounded-xl bg-subtle pl-9 text-sm focus:bg-paper",
          "focus:border-line-struct focus:ring-0 focus-visible:border-line-struct focus-visible:ring-2 focus-visible:ring-line-struct/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
          inputClassName,
        )}
      />
    </div>
  );
}
