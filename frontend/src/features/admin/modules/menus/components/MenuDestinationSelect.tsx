import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, TriangleAlert } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import { cn } from "@shared/utils/styling/cn";
import { MENU_DESTINATIONS } from "@/app/navigation/menu-destinations.generated";
import { MENU_DESTINATION_LABELS } from "@/app/navigation/menu-destinations.labels";
import type { MenuDestination } from "@/app/navigation/menu-destinations.generated";

interface MenuDestinationSelectProps {
  /** `url` del destino seleccionado, o `null` si todavia no se eligio
   * ninguno. */
  value: string | null;
  /**
   * El caller SIEMPRE recibe el `MenuDestination` completo (path +
   * permissions), nunca solo el path -- asi `url` y `permissionCodes` se
   * setean JUNTOS, desde la MISMA seleccion. El formulario nunca deja que
   * el admin edite un codigo de permiso por separado (ver D3 del design:
   * el permiso se DERIVA del destino, no se captura crudo).
   */
  onChange: (destination: MenuDestination) => void;
  disabled?: boolean;
  className?: string;
}

interface DestinationOption {
  destination: MenuDestination;
  label: string;
  grupo: string;
  isUnmanaged: boolean;
}

const buildOptions = (): DestinationOption[] =>
  MENU_DESTINATIONS.map((destination) => {
    const meta = MENU_DESTINATION_LABELS[destination.path];
    return {
      destination,
      label: meta?.label ?? destination.path,
      grupo: meta?.grupo ?? "Otros",
      isUnmanaged: destination.permissions.length === 0,
    };
  }).sort((a, b) =>
    a.grupo === b.grupo
      ? a.label.localeCompare(b.label, "es")
      : a.grupo.localeCompare(b.grupo, "es"),
  );

/**
 * Selector de destino para un acceso directo -- Paso 2 del
 * `ModuleCreateWizard` (y el equivalente al editar un modulo existente).
 *
 * Busca por LABEL humano, nunca por path ni por codigo de permiso: el
 * admin que arma el menu no necesita saber que `/admin/catalogos/areas`
 * requiere `admin:catalogos:areas:read`, solo que existe una pantalla
 * "Áreas". El codigo de permiso jamas aparece como texto visible en este
 * componente.
 */
export function MenuDestinationSelect({
  value,
  onChange,
  disabled = false,
  className,
}: MenuDestinationSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const options = useMemo(() => buildOptions(), []);
  const selected = options.find((option) => option.destination.path === value);

  const normalizedSearch = search.trim().toLowerCase();
  const filtered =
    normalizedSearch.length === 0
      ? options
      : options.filter(
          (option) =>
            option.label.toLowerCase().includes(normalizedSearch) ||
            option.grupo.toLowerCase().includes(normalizedSearch),
        );

  const handleSelect = (option: DestinationOption) => {
    onChange(option.destination);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="space-y-2">
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (!disabled) setOpen(next);
        }}
      >
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
              className,
            )}
          >
            <span className="truncate">
              {selected ? selected.label : "Selecciona un destino"}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-2"
        >
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar pantalla..."
            className="mb-2 h-8 text-sm"
            autoFocus
          />
          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-txt-muted">
                Sin resultados
              </p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.destination.path}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover",
                    value === option.destination.path &&
                      "bg-surface-hover font-medium",
                  )}
                >
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      value === option.destination.path
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <span className="flex-1 truncate">{option.label}</span>
                  <span className="shrink-0 text-[11px] text-txt-muted">
                    {option.grupo}
                  </span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selected?.isUnmanaged ? (
        <div className="flex items-start gap-2 rounded-lg border border-status-warning/30 bg-status-warning/5 px-3 py-2 text-xs text-status-warning">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          <p>
            Esta pantalla es visible para cualquiera que vea la carpeta que
            la contiene — no se puede restringir a un grupo de usuarios en
            particular.
          </p>
        </div>
      ) : null}
    </div>
  );
}
