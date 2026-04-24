import { useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { cn } from "@shared/utils/styling/cn";
interface ClinicOption {
  id: number;
  name: string;
}

interface ClinicComboboxProps {
  value: number | null;
  onChange: (value: number | null) => void;
  options: ClinicOption[];
  disabled?: boolean;
  placeholder?: string;
}

export function ClinicCombobox({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Selecciona un centro",
}: ClinicComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value) ?? null;

  const filtered = useMemo(() => {
    const normalize = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const q = normalize(search.trim());
    if (!q) return options;
    return options.filter((o) => normalize(o.name).includes(q));
  }, [options, search]);

  const handleSelect = (id: number | null) => {
    onChange(id);
    setOpen(false);
    setSearch("");
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selected && "text-txt-muted",
          )}
        >
          <span className="truncate">
            {selected ? selected.name : placeholder}
          </span>
          <div className="ml-2 flex shrink-0 items-center gap-1">
            {selected ? (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Limpiar selección"
                className="rounded p-0.5 text-txt-muted hover:text-txt-body"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(null);
                }}
              >
                <X className="size-3.5" />
              </span>
            ) : null}
            <ChevronsUpDown className="size-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        {/* Búsqueda */}
        <div className="flex items-center gap-2 border-b border-line-struct px-3 py-2">
          <Search className="size-4 shrink-0 text-txt-muted" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-txt-muted hover:text-txt-body"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {/* Lista */}
        <div className="max-h-56 overflow-y-auto py-1">
          {/* Sin centro */}
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-subtle/40",
              value === null && "font-medium text-txt-body",
            )}
            onClick={() => handleSelect(null)}
          >
            <Check
              className={cn(
                "size-4 shrink-0",
                value === null ? "text-primary opacity-100" : "opacity-0",
              )}
            />
            <span className="text-txt-muted italic">Sin centro</span>
          </button>

          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-txt-muted">
              Sin resultados para &quot;{search}&quot;
            </p>
          ) : (
            filtered.map((clinic) => (
              <button
                key={clinic.id}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-subtle/40",
                  value === clinic.id && "font-medium text-txt-body",
                )}
                onClick={() => handleSelect(clinic.id)}
              >
                <Check
                  className={cn(
                    "size-4 shrink-0",
                    value === clinic.id
                      ? "text-primary opacity-100"
                      : "opacity-0",
                  )}
                />
                <span className="truncate">{clinic.name}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
