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
    <div className={cn("relative w-full min-w-45 max-w-65", className)}>
      <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-txt-muted" />
      <Input
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("pl-9", inputClassName)}
      />
    </div>
  );
}
