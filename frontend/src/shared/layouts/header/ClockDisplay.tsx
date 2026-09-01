import { Clock } from "lucide-react";
import { useServerClock } from "@shared/hooks/useServerClock";

const timeFormatter = new Intl.DateTimeFormat("es-MX", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});

/**
 * Reloj visible en el header, compartido por todas las pestañas.
 * Usa la hora sincronizada con el servidor (@shared/hooks/useServerClock),
 * no la del reloj local del equipo.
 */
export const ClockDisplay = () => {
  const now = useServerClock();

  return (
    <div
      className="hidden items-center gap-2 rounded-full border border-line-hairline bg-subtle px-3 py-1.5 text-sm text-muted-foreground md:flex"
      role="status"
      aria-label={`Hora actual: ${timeFormatter.format(now)}`}
    >
      <Clock className="size-4 shrink-0" aria-hidden="true" />
      <span className="tabular-nums font-medium text-foreground">
        {timeFormatter.format(now)}
      </span>
      <span className="capitalize">{dateFormatter.format(now)}</span>
    </div>
  );
};
