import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
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
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function isPastSlot(dateStr: string, hora: string, today: string, now: Date): boolean {
  if (dateStr < today) return true;
  if (dateStr === today) {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
  }
  return false;
}

function consultorioLabel(slot: AgendaSlot): string {
  if (slot.consultorioNombre) return slot.consultorioNombre;
  if (slot.consultorioNumero != null) return `Consultorio #${slot.consultorioNumero}`;
  return "";
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SlotCalendarProps {
  medicoId:      number;
  medicoNombre?: string;
  weekStart:     string;
  onSlotClick:   (fecha: string, slot: AgendaSlot) => void;
}

// ─── Subcomponente: celda de slot ─────────────────────────────────────────────

interface SlotCellProps {
  dateStr:  string;
  hora:     string;
  slot:     AgendaSlot | undefined;
  today:    string;
  now:      Date;
  isToday:  boolean;
  onClick:  (dateStr: string, slot: AgendaSlot) => void;
}

function SlotCell({ dateStr, hora, slot, today, now, isToday, onClick }: SlotCellProps) {
  if (!slot) {
    return (
      <div
        className={cn(
          "h-16 rounded-lg border border-dashed border-line-struct/30",
          isToday && "border-primary/10 bg-primary/[0.02]",
        )}
      />
    );
  }

  const esPasado  = isPastSlot(dateStr, slot.hora, today, now);
  const esOcupado = !slot.disponible && !esPasado;
  const label     = consultorioLabel(slot);

  if (esPasado) {
    return (
      <div className="h-16 rounded-lg border border-line-struct/20 bg-subtle/20 px-2 py-2 flex flex-col justify-center">
        <p className="font-mono text-xs font-medium text-txt-muted/30 line-through text-center">
          {hora}
        </p>
        {label && (
          <p className="text-[10px] text-txt-muted/20 text-center truncate mt-0.5">{label}</p>
        )}
      </div>
    );
  }

  if (esOcupado) {
    return (
      <div
        className={cn(
          "h-16 rounded-lg border border-amber-200 bg-amber-50/60 px-2 py-2 flex flex-col justify-center gap-0.5",
          isToday && "border-amber-300 bg-amber-50",
        )}
        title={`${hora} — Ocupado${slot.cita ? ` · Exp. ${slot.cita.noExp}` : ""}`}
      >
        <div className="flex items-center justify-center gap-1">
          <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
          <p className="text-[11px] font-semibold text-amber-700">Agendado</p>
        </div>
        {slot.cita?.noExp && (
          <p className="font-mono text-[10px] text-amber-600/80 text-center truncate">
            Exp. {slot.cita.noExp}
          </p>
        )}
        {label && (
          <p className="text-[10px] text-amber-500/70 text-center truncate">{label}</p>
        )}
      </div>
    );
  }

  // Libre
  return (
    <button
      type="button"
      onClick={() => onClick(dateStr, slot)}
      title={`${hora} — Disponible · ${slot.duracionMin} min${label ? ` · ${label}` : ""}`}
      className={cn(
        "group h-16 w-full rounded-lg border px-2 py-2 flex flex-col items-center justify-center gap-0.5",
        "transition-all duration-150",
        "border-emerald-300 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-sm active:scale-[0.97]",
        isToday && "border-emerald-400 bg-emerald-50/80 ring-1 ring-emerald-200/60",
      )}
    >
      <div className="flex items-center gap-1">
        <Plus className="size-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="text-[11px] font-bold text-emerald-700">{slot.duracionMin} min</span>
      </div>
      {label && (
        <p className="text-[10px] text-emerald-600/80 text-center truncate max-w-full px-1">{label}</p>
      )}
      <p className="text-[9px] font-medium text-emerald-500/60 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
        Generar ficha
      </p>
    </button>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

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

  // Conteos para el resumen
  const totalLibres  = days.reduce((acc, d) =>
    acc + (data?.agenda[d] ?? []).filter((s) => s.disponible && !isPastSlot(d, s.hora, today, now)).length, 0);
  const totalOcupados = days.reduce((acc, d) =>
    acc + (data?.agenda[d] ?? []).filter((s) => !s.disponible && !isPastSlot(d, s.hora, today, now)).length, 0);

  if (isError) {
    return (
      <p className="py-8 text-center text-sm text-status-critical">
        No se pudo cargar la disponibilidad. Intenta de nuevo.
      </p>
    );
  }

  return (
    <div className="relative">

      {/* ── Header: médico + resumen + leyenda ──────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {medicoNombre && (
            <div className="flex items-center gap-2 rounded-xl border border-line-struct/60 bg-subtle/20 px-3 py-1.5">
              <span className="text-xs font-semibold text-txt-muted uppercase tracking-wide">Médico</span>
              <span className="text-sm font-semibold text-txt-body">{medicoNombre}</span>
            </div>
          )}
          {data && !isFetching && (
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {totalLibres} disponibles
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                {totalOcupados} ocupados
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-txt-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded border border-emerald-300 bg-emerald-50" />
            <span className="font-medium text-emerald-700">Disponible — click para generar ficha</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded border border-amber-200 bg-amber-50" />
            <span className="font-medium text-amber-600">Agendado</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded border border-dashed border-line-struct/30 bg-subtle/20" />
            <span className="text-txt-muted/60">Pasado / sin horario</span>
          </span>
        </div>
      </div>

      {/* Overlay de carga */}
      {isFetching && data ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-paper/70 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 text-sm text-txt-muted">
            <Loader2 className="size-4 animate-spin" /> Actualizando...
          </div>
        </div>
      ) : null}

      {/* ── Grilla ──────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">

          {/* Cabecera de días */}
          <div className="mb-2 grid gap-1" style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}>
            <div /> {/* vacío para el eje de horas */}
            {days.map((dateStr, i) => {
              const isToday   = dateStr === today;
              const isPastDay = dateStr < today;
              return (
                <div
                  key={dateStr}
                  className={cn(
                    "rounded-xl py-2.5 text-center",
                    isToday
                      ? "bg-primary/10 ring-1 ring-primary/20"
                      : isPastDay
                      ? "bg-subtle/20"
                      : "bg-subtle/10",
                  )}
                >
                  <p className={cn(
                    "text-xs font-bold uppercase tracking-wide",
                    isToday ? "text-primary" : isPastDay ? "text-txt-muted/40" : "text-txt-muted",
                  )}>
                    {DAY_LABELS[i]}
                  </p>
                  <p className={cn(
                    "mt-0.5 font-mono text-[11px]",
                    isToday ? "font-bold text-primary" : isPastDay ? "text-txt-muted/30" : "text-txt-muted/70",
                  )}>
                    {formatDayDate(dateStr)}
                  </p>
                  {isToday && (
                    <span className="mt-1 inline-block rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                      hoy
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Skeleton primera carga */}
          {!data && isFetching ? (
            <div className="space-y-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="grid gap-1" style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}>
                  <div className="h-16 flex items-center justify-end pr-2">
                    <div className="h-3 w-8 animate-pulse rounded bg-subtle/60" />
                  </div>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <div key={j} className="h-16 animate-pulse rounded-lg bg-subtle/40" />
                  ))}
                </div>
              ))}
            </div>

          ) : allHoras.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-txt-muted">Sin horarios configurados para esta semana.</p>
              <p className="mt-1 text-xs text-txt-muted/60">Verificá la agenda del médico en configuración.</p>
            </div>

          ) : (
            <div className="space-y-1.5">
              {allHoras.map((hora) => (
                <div key={hora} className="grid items-center gap-1" style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}>
                  {/* Etiqueta de hora */}
                  <div className="flex items-center justify-end pr-2">
                    <span className="font-mono text-xs font-semibold text-txt-muted/50">{hora}</span>
                  </div>

                  {/* Celdas de cada día */}
                  {days.map((dateStr) => (
                    <SlotCell
                      key={dateStr}
                      dateStr={dateStr}
                      hora={hora}
                      slot={(data?.agenda[dateStr] ?? []).find((s) => s.hora === hora)}
                      today={today}
                      now={now}
                      isToday={dateStr === today}
                      onClick={onSlotClick}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
