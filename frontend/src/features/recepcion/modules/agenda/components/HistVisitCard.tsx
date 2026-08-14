import { useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { useVisitStatusLog } from "@features/recepcion/modules/checkin/queries/useVisitStatusLog";
import { formatCitaFechaHora } from "@features/recepcion/shared/utils/recepcion-format";
import type { VisitQueueItem } from "@api/types";

const VISIT_STATUS_LABEL: Record<string, string> = {
  en_espera:         "En espera",
  en_somatometria:   "En somatometría",
  lista_para_doctor: "Lista para doctor",
  en_consulta:       "En consulta",
  cerrada:           "Cerrada",
  cancelada:         "Cancelada",
  no_show:           "No se presentó",
};

const VISIT_BADGE_VARIANT: Record<string,
  "outline" | "stable" | "alert" | "secondary" | "critical"
> = {
  en_espera:         "outline",
  en_somatometria:   "alert",
  lista_para_doctor: "alert",
  en_consulta:       "stable",
  cerrada:           "secondary",
  cancelada:         "critical",
  no_show:           "critical",
};

export function HistVisitCard({ visit }: { visit: VisitQueueItem }) {
  const [expanded, setExpanded] = useState(false);
  const { data: log, isLoading: logLoading } = useVisitStatusLog(visit.id, expanded);

  return (
    <article className="rounded-xl border border-line-struct bg-paper overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 py-3 bg-subtle/20 border-b border-line-struct/50">
        <div>
          <p className="font-mono text-sm font-bold text-txt-body tracking-widest">{visit.folio}</p>
          <p className="text-[10px] text-txt-muted mt-0.5">Ficha de consulta · {visit.arrivalType === "appointment" ? "Con cita" : "Sin cita"}</p>
        </div>
        <Badge variant={VISIT_BADGE_VARIANT[visit.status] ?? "outline"} className="text-xs shrink-0">
          {VISIT_STATUS_LABEL[visit.status] ?? visit.status}
        </Badge>
      </div>

      {/* Datos */}
      <div className="px-5 py-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-txt-muted mb-0.5">Fecha de registro</p>
          <p className="font-medium">{visit.fechaAlta ? formatCitaFechaHora(visit.fechaAlta) : "—"}</p>
        </div>
        {visit.doctorNombre ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-txt-muted mb-0.5">Médico</p>
            <p className="font-medium">{visit.doctorNombre}</p>
          </div>
        ) : null}
        {visit.consultorioNombre ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-txt-muted mb-0.5">Consultorio</p>
            <p className="font-medium">{visit.consultorioNombre}</p>
          </div>
        ) : null}
        {visit.horaConsulta ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-txt-muted mb-0.5">Hora de cita</p>
            <p className="font-mono font-semibold text-primary">{visit.horaConsulta}</p>
          </div>
        ) : null}
        {visit.notes ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-txt-muted mb-0.5">Motivo</p>
            <p className="text-txt-body/80 text-sm">{visit.notes}</p>
          </div>
        ) : null}
      </div>

      {/* Movimientos NOM-024 */}
      <div className="px-5 py-2.5 border-t border-line-struct/40 bg-subtle/10">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <ChevronRight className={`size-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
          {expanded ? "Ocultar movimientos" : "Ver movimientos — auditoría NOM-024 §6"}
        </button>

        {expanded ? (
          <div className="mt-3">
            {logLoading ? (
              <div className="flex items-center gap-2 text-xs text-txt-muted py-1">
                <Loader2 className="size-3 animate-spin" /> Cargando historial de movimientos...
              </div>
            ) : log && log.length > 0 ? (
              <div className="space-y-0 pl-1 border-l-2 border-line-struct/40">
                {log.map((entry) => (
                  <div key={entry.id} className="relative flex items-start gap-3 py-2 pl-3">
                    <div className="absolute -left-[5px] top-3 size-2 rounded-full bg-primary/50 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1 text-xs">
                        {entry.fromStatus ? (
                          <span className="text-txt-muted">
                            {VISIT_STATUS_LABEL[entry.fromStatus] ?? entry.fromStatus}
                          </span>
                        ) : null}
                        {entry.fromStatus ? <span className="text-txt-muted">→</span> : null}
                        <span className="font-semibold text-txt-body">
                          {VISIT_STATUS_LABEL[entry.toStatus] ?? entry.toStatus}
                        </span>
                      </div>
                      <p className="text-[10px] text-txt-muted mt-0.5">
                        {new Date(entry.changedAt).toLocaleString("es-MX", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                          timeZone: "America/Mexico_City",
                        })}
                        {entry.changedByNombre ? ` · ${entry.changedByNombre}` : ""}
                      </p>
                      {entry.notes ? (
                        <p className="text-[10px] italic text-txt-muted/70 mt-0.5">{entry.notes}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-txt-muted py-1 italic">Sin movimientos registrados.</p>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}
