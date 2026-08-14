import { Badge } from "@shared/ui/badge";

export function AppointmentAlertBadge({ minutesUntil }: { minutesUntil: number | null }) {
  if (minutesUntil === null || minutesUntil > 15 || minutesUntil < -30) return null;

  if (minutesUntil >= -5 && minutesUntil <= 5) {
    return <Badge variant="critical" className="shrink-0 text-[10px] py-0 animate-pulse">¡Ahora!</Badge>;
  }
  if (minutesUntil > 5) {
    return <Badge variant="alert" className="shrink-0 text-[10px] py-0">En {minutesUntil} min</Badge>;
  }
  return <Badge variant="alert" className="shrink-0 text-[10px] py-0">{Math.abs(minutesUntil)} min tarde</Badge>;
}

export function ConsultationElapsedBadge({ startedAt, now }: { startedAt: Date | undefined; now: Date }) {
  const elapsed = startedAt ? Math.floor((now.getTime() - startedAt.getTime()) / 60_000) : null;
  const label = elapsed !== null && elapsed > 0 ? `${elapsed} min en consulta` : "En consulta";
  return <Badge variant="stable" className="shrink-0 text-[10px] py-0">{label}</Badge>;
}
