/**
 * AgendaSemanalPage — Vista de agenda por médico.
 *
 * Muestra los slots de la semana seleccionada con su estado:
 *   🟢 Libre       → slot disponible sin cita
 *   🔵 Agendada    → cita agendada
 *   🟡 Confirmada  → cita confirmada
 *   ✅ Atendida    → cita atendida
 *   🔴 Cancelada   → cita cancelada / slot no disponible
 */

import { useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, RotateCcw,
} from "lucide-react";
import { Button }  from "@shared/ui/button";
import { Label }   from "@shared/ui/label";
import { Skeleton } from "@shared/ui/skeleton";
import { Badge }   from "@shared/ui/badge";
import { useMedicosList } from "@features/admin/modules/medicos/hooks/useMedicos";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import { useAgendaSemanal } from "@features/recepcion/modules/citas/queries/useAgendaSemanal";
import { useMutation } from "@tanstack/react-query";
import apiClient from "@api/client";
import type { AgendaSlot } from "@api/types/agenda.types";

// ─── Botón para generar slots ─────────────────────────────────────────────────

function GenerarSlotsButton({ medicoId, onSuccess }: { medicoId: number; onSuccess: () => void }) {
  const mutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/medicos/${medicoId}/slots/generar`, { diasAdelante: 30 }),
    onSuccess: () => {
      toast.success("Slots generados correctamente.");
      onSuccess();
    },
    onError: () => toast.error("No se pudieron generar los slots."),
  });

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-xs"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending
        ? <RotateCcw className="size-3.5 animate-spin" />
        : <CalendarDays className="size-3.5" />}
      Generar slots (30 días)
    </Button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIAS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES_ES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];

function getLunes(ref: Date): Date {
  const d = new Date(ref);
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatHeader(d: Date): string {
  return `${DIAS_ES[d.getDay()]} ${d.getDate()}`;
}

function esHoy(d: Date): boolean {
  return toISO(d) === toISO(new Date());
}

// ─── Slot individual ──────────────────────────────────────────────────────────

function SlotCell({ slot }: { slot: AgendaSlot }) {
  if (!slot.disponible && !slot.cita) {
    return (
      <div className="rounded-lg bg-subtle/30 px-2 py-1.5 text-center">
        <p className="text-xs text-txt-muted font-mono">{slot.hora}</p>
        <p className="text-[10px] text-txt-muted mt-0.5">No disponible</p>
      </div>
    );
  }

  if (!slot.cita) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-2 py-1.5 text-center">
        <p className="text-xs font-mono font-semibold text-green-700">{slot.hora}</p>
        <p className="text-[10px] text-green-600 mt-0.5">Libre</p>
      </div>
    );
  }

  const ESTATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    agendada:   { bg: "bg-blue-50 border-blue-200",   text: "text-blue-700",   dot: "bg-blue-500",   label: "Agendada"   },
    confirmada: { bg: "bg-primary/5 border-primary/30", text: "text-primary",  dot: "bg-primary",    label: "Confirmada" },
    atendida:   { bg: "bg-secondary/10 border-secondary/30", text: "text-secondary-foreground", dot: "bg-green-500", label: "Atendida" },
    cancelada:  { bg: "bg-red-50 border-red-200",     text: "text-red-700",    dot: "bg-red-400",    label: "Cancelada"  },
    no_asistio: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700",  dot: "bg-amber-400",  label: "No asistió" },
  };

  const cfg = ESTATUS_CONFIG[slot.cita.estatus] ?? ESTATUS_CONFIG.agendada;

  return (
    <div className={`rounded-lg border px-2 py-1.5 ${cfg.bg}`}>
      <div className="flex items-center gap-1 mb-0.5">
        <span className={`size-1.5 shrink-0 rounded-full ${cfg.dot}`} />
        <p className={`text-xs font-mono font-semibold ${cfg.text}`}>{slot.hora}</p>
      </div>
      <p className={`text-[10px] font-mono truncate ${cfg.text}`}>{slot.cita.noExp}</p>
      {slot.cita.motivo ? (
        <p className="text-[10px] text-txt-muted truncate">{slot.cita.motivo}</p>
      ) : null}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function AgendaSemanalPage() {
  const [lunes,    setLunes]    = useState(() => getLunes(new Date()));
  const [medicoId, setMedicoId] = useState<number | null>(null);
  const [centroId, setCentroId] = useState<number | null>(null);

  const viernes   = addDays(lunes, 4);
  const fechaDesde = toISO(lunes);
  const fechaHasta = toISO(viernes);

  const { data: centrosData } = useCentrosAtencionList({ isActive: true });
  const centros = centrosData?.items ?? [];

  const { data: medicosData } = useMedicosList({ estatusMedico: "ACTIVO" });
  const allMedicos = medicosData?.items ?? [];
  const medicos = centroId
    ? allMedicos.filter((m) => m.centros.some((c) => c.centroId === centroId))
    : allMedicos;

  const { data, isLoading, isFetching, refetch } = useAgendaSemanal(
    medicoId, fechaDesde, fechaHasta,
  );

  const diasSemana = Array.from({ length: 5 }, (_, i) => addDays(lunes, i));

  // Obtener todos los horarios únicos de la semana para las filas
  const horasUnicas = Array.from(
    new Set(
      diasSemana.flatMap((d) =>
        (data?.agenda[toISO(d)] ?? []).map((s) => s.hora)
      ),
    ),
  ).sort();

  const semanaLabel = `${lunes.getDate()} – ${viernes.getDate()} de ${MESES_ES[viernes.getMonth()]} ${viernes.getFullYear()}`;

  return (
    <div className="space-y-5 p-6">

      {/* ── Encabezado ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10">
            <CalendarDays className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-txt-body">Agenda semanal</h1>
            <p className="text-xs text-txt-muted">
              Disponibilidad y citas por médico
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {medicoId ? (
            <GenerarSlotsButton medicoId={medicoId} onSuccess={() => void refetch()} />
          ) : null}
          <Button
            variant="ghost" size="icon" className="size-9"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RotateCcw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* ── Filtros ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line-struct/60 bg-subtle/10 p-4">
        {centros.length > 1 ? (
          <div className="space-y-1 w-48">
            <Label className="text-xs">Centro de atención</Label>
            <select
              className="h-9 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
              value={centroId ?? ""}
              onChange={(e) => {
                setCentroId(e.target.value ? Number(e.target.value) : null);
                setMedicoId(null);
              }}
            >
              <option value="">Todos los centros</option>
              {centros.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="space-y-1 w-56">
          <Label className="text-xs">Médico</Label>
          <select
            className="h-9 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
            value={medicoId ?? ""}
            onChange={(e) => setMedicoId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Selecciona un médico</option>
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>{m.nombreCompleto}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Navegación de semana ───────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline" size="sm" className="gap-1.5"
          onClick={() => setLunes((d) => addDays(d, -7))}
        >
          <ChevronLeft className="size-4" />
          Semana anterior
        </Button>

        <p className="text-sm font-medium text-txt-body">{semanaLabel}</p>

        <Button
          variant="outline" size="sm" className="gap-1.5"
          onClick={() => setLunes((d) => addDays(d, 7))}
        >
          Semana siguiente
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* ── Leyenda ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {[
          { color: "bg-green-500",  label: "Libre" },
          { color: "bg-blue-500",   label: "Agendada" },
          { color: "bg-primary",    label: "Confirmada" },
          { color: "bg-green-400",  label: "Atendida" },
          { color: "bg-red-400",    label: "Cancelada" },
          { color: "bg-subtle",     label: "No disponible" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${color}`} />
            <span className="text-txt-muted">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Grid de la semana ──────────────────────────────────── */}
      {!medicoId ? (
        <div className="rounded-xl border border-line-struct bg-paper py-16 text-center text-sm text-txt-muted">
          Selecciona un médico para ver su agenda.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-8 w-full rounded-lg" />
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line-struct bg-paper">
          <div className="grid grid-cols-5 min-w-[600px]">

            {/* Headers de días */}
            {diasSemana.map((dia) => (
              <div
                key={toISO(dia)}
                className={`border-b border-r border-line-struct px-3 py-3 text-center last:border-r-0 ${
                  esHoy(dia) ? "bg-primary/5" : "bg-subtle/20"
                }`}
              >
                <p className={`text-xs font-bold uppercase tracking-wide ${
                  esHoy(dia) ? "text-primary" : "text-txt-muted"
                }`}>
                  {formatHeader(dia)}
                </p>
                {esHoy(dia) ? (
                  <span className="mt-1 inline-block rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wide">
                    Hoy
                  </span>
                ) : null}
              </div>
            ))}

            {/* Contenido por día */}
            {diasSemana.map((dia) => {
              const slots = data?.agenda[toISO(dia)] ?? [];
              return (
                <div
                  key={toISO(dia)}
                  className={`border-r border-line-struct p-2 last:border-r-0 space-y-1.5 ${
                    esHoy(dia) ? "bg-primary/[0.02]" : ""
                  }`}
                >
                  {slots.length === 0 ? (
                    <p className="py-6 text-center text-xs text-txt-muted italic">
                      Sin slots
                    </p>
                  ) : (
                    slots.map((slot) => (
                      <SlotCell key={slot.id} slot={slot} />
                    ))
                  )}
                </div>
              );
            })}
          </div>

          {/* Resumen de la semana */}
          {data ? (
            <div className="border-t border-line-struct px-4 py-2.5 flex flex-wrap gap-4 text-xs text-txt-muted bg-subtle/10">
              {(() => {
                const todosSlots = diasSemana.flatMap(
                  (d) => data.agenda[toISO(d)] ?? []
                );
                const libres    = todosSlots.filter((s) => s.disponible && !s.cita).length;
                const ocupados  = todosSlots.filter((s) => s.cita).length;
                const total     = todosSlots.length;
                return (
                  <>
                    <span>Total slots: <strong className="text-txt-body">{total}</strong></span>
                    <span>Libres: <strong className="text-green-600">{libres}</strong></span>
                    <span>Ocupados: <strong className="text-primary">{ocupados}</strong></span>
                    <span>Ocupación: <strong className="text-txt-body">
                      {total > 0 ? Math.round((ocupados / total) * 100) : 0}%
                    </strong></span>
                  </>
                );
              })()}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default AgendaSemanalPage;
