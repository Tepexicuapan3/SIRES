import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { AgendaSlot } from "@api/types/agenda.types";
import { useAgendaSemanal } from "@features/recepcion/modules/citas/queries/useAgendaSemanal";
import { cn } from "@shared/utils/styling/cn";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatDayDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", {
    day: "2-digit", month: "short",
  });
}

function nowToday(): string {
  return new Date().toISOString().slice(0, 10);
}

// Un slot es "pasado" si su fecha ya pasó, o si es hoy y la hora ya transcurrió
function isPastSlot(dateStr: string, hora: string, today: string, now: Date): boolean {
  if (dateStr < today) return true;
  if (dateStr === today) {
    const [h, m] = hora.split(":").map(Number);
    const slotMin = h * 60 + m;
    const nowMin  = now.getHours() * 60 + now.getMinutes();
    return slotMin <= nowMin;
  }
  return false;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SlotCalendarProps {
  medicoId:      number;
  medicoNombre?: string;
  weekStart:     string;   // Monday YYYY-MM-DD
  onSlotClick:   (fecha: string, slot: AgendaSlot) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function SlotCalendar({ medicoId, medicoNombre, weekStart, onSlotClick }: SlotCalendarProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const today   = nowToday();
  const weekEnd = addDays(weekStart, 6);
  const days    = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data, isFetching, isError } = useAgendaSemanal(medicoId, weekStart, weekEnd);

  const allHoras = Array.from(
    new Set(days.flatMap((d) => (data?.agenda[d] ?? []).map((s) => s.hora)))
  ).sort();

  if (isError) {
    return (
      <p className="py-8 text-center text-sm text-status-critical">
        No se pudo cargar la disponibilidad. Intenta de nuevo.
      </p>
    );
  }

  return (
    <div className="relative overflow-x-auto">

      {/* ── Header: médico + leyenda ──────────────────────────────── */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        {medicoNombre ? (
          <div className="flex items-center gap-2 rounded-xl border border-line-struct/60 bg-subtle/20 px-3 py-1.5">
            <span className="text-xs font-semibold text-txt-muted uppercase tracking-wide">Médico</span>
            <span className="text-sm font-semibold text-txt-body">{medicoNombre}</span>
          </div>
        ) : <div />}

        {/* Leyenda de estados — siempre visible */}
        <div className="flex items-center gap-3 text-xs text-txt-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded border border-emerald-400 bg-emerald-100" />
            <span className="font-medium text-emerald-700">Disponible</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded border border-red-300 bg-red-100" />
            <span className="font-medium text-red-500">Ocupado</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded border border-line-struct/60 bg-subtle/40" />
            <span className="text-txt-muted/70">Pasado</span>
          </span>
        </div>
      </div>

      {/* Overlay de carga sobre datos existentes */}
      {isFetching && data ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-paper/70 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 text-sm text-txt-muted">
            <Loader2 className="size-4 animate-spin" /> Actualizando...
          </div>
        </div>
      ) : null}

      <div className="min-w-[560px]">

        {/* ── Cabecera de días ──────────────────────────────────────── */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {days.map((dateStr, i) => {
            const isToday   = dateStr === today;
            const isPastDay = dateStr < today;
            return (
              <div
                key={dateStr}
                className={cn(
                  "rounded-xl py-2 text-center text-xs font-semibold",
                  isToday   ? "bg-primary/10 text-primary" :
                  isPastDay ? "text-txt-muted/40" :
                              "text-txt-muted",
                )}
              >
                <p>{DAY_LABELS[i]}</p>
                <p className={cn("mt-0.5 font-mono text-[11px]", isToday && "font-bold")}>
                  {formatDayDate(dateStr)}
                </p>
                {isPastDay ? (
                  <p className="text-[9px] mt-0.5 opacity-60">pasado</p>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* ── Skeleton primera carga ────────────────────────────────── */}
        {!data && isFetching ? (
          <div className="space-y-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="h-11 animate-pulse rounded-lg bg-subtle/40" />
                ))}
              </div>
            ))}
          </div>

        ) : allHoras.length === 0 ? (
          <p className="py-12 text-center text-sm text-txt-muted">
            Sin horarios configurados para esta semana.
          </p>

        ) : (
          /* ── Grilla de slots ─────────────────────────────────────── */
          <div className="space-y-1">
            {allHoras.map((hora) => (
              <div key={hora} className="grid grid-cols-7 gap-1">
                {days.map((dateStr) => {
                  const slot = (data?.agenda[dateStr] ?? []).find((s) => s.hora === hora);
                  if (!slot) return <div key={dateStr} className="h-11" />;

                  const esPasado  = isPastSlot(dateStr, slot.hora, today, now);
                  const esOcupado = !slot.disponible && !esPasado;
                  const esLibre   = slot.disponible  && !esPasado;

                  const canClick = esLibre;

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      disabled={!canClick}
                      onClick={() => canClick && onSlotClick(dateStr, slot)}
                      title={
                        esPasado  ? `${hora} — Horario pasado`
                        : esOcupado ? `${hora} — Ocupado${slot.cita ? ` · Exp. ${slot.cita.noExp}` : ""}`
                        : `${hora} — Disponible (${slot.duracionMin} min)`
                      }
                      className={cn(
                        "h-11 w-full rounded-lg border px-1 py-1.5 text-center text-xs font-medium transition-colors",
                        esLibre   ? "cursor-pointer border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400"
                        : esOcupado ? "cursor-not-allowed border-red-200 bg-red-50 text-red-400"
                        : /* pasado */ "cursor-not-allowed border-line-struct/40 bg-subtle/30 text-txt-muted/40",
                      )}
                    >
                      <p className={cn("font-mono font-semibold leading-none", esPasado && "line-through")}>
                        {hora}
                      </p>
                      <p className="mt-0.5 text-[10px] font-normal opacity-70 truncate">
                        {esPasado ? "pasado" : (
                          <>
                            {slot.duracionMin}m
                            {slot.consultorioNombre
                              ? ` · ${slot.consultorioNombre}`
                              : slot.consultorioNumero != null
                              ? ` · #${slot.consultorioNumero}`
                              : ""}
                          </>
                        )}
                      </p>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
