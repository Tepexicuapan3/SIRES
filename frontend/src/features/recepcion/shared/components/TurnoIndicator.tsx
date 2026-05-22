import { Clock } from "lucide-react";
import { useTurnoActual } from "@features/recepcion/modules/turnos/hooks/useTurnosFicha";

/**
 * Muestra el turno activo y cuántas fichas quedan.
 * Rojo cuando se agotaron, amarillo cuando quedan pocas (≤3), verde el resto.
 */
export function TurnoIndicator() {
  const { data, isLoading } = useTurnoActual();

  if (isLoading || !data?.turno) return null;

  const { fichasUsadas, maxFichas, disponibles } = data;
  const agotado = disponibles === 0;
  const pocas   = disponibles > 0 && disponibles <= 3;

  const colorClass = agotado
    ? "border-status-critical/30 bg-status-critical/10 text-status-critical"
    : pocas
    ? "border-amber-300/40 bg-amber-50 text-amber-700"
    : "border-primary/20 bg-primary/5 text-primary";

  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium ${colorClass}`}>
      <Clock className="size-3.5 shrink-0" />
      <span>{data.turno.nombre}</span>
      <span className="opacity-50">·</span>
      <span>
        {fichasUsadas}/{maxFichas} fichas
        {agotado ? " — agotadas" : pocas ? ` — quedan ${disponibles}` : ""}
      </span>
    </div>
  );
}
