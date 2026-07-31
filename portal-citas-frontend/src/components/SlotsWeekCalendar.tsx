/**
 * Calendario visual semanal de horarios del portal (Fase F2 — reemplaza el
 * viejo selector de "botones de fecha + lista de horarios").
 *
 * INSPIRACIÓN (NO reuso directo): el patrón visual viene de
 * `frontend/src/features/recepcion/modules/citas/components/SlotCalendar.tsx`
 * (grilla con `gridTemplateColumns`, eje de horas a la izquierda, celdas
 * coloreadas, badge "hoy", conteos disponibles/ocupados). Ese componente
 * interno está acoplado a datos de recepción (nombre de paciente, folio en
 * el tooltip de un slot ocupado) — este componente es una reimplementación
 * desde cero, 100% genérica: una celda "ocupado" nunca muestra quién ocupa
 * el slot, solo la hora y la palabra "Ocupado".
 *
 * DIFERENCIA CLAVE de armado del eje de horas vs. el componente interno:
 * el interno arma la agenda de UN solo médico (una fila por hora = un slot
 * como máximo por día). Acá `GET /portal/slots` agrega TODOS los médicos
 * con canal apto para portal en la fecha pedida, así que puede haber varios
 * slots con la misma hora el mismo día (distintos médicos/consultorios en
 * paralelo). Por eso cada celda (día, hora) renderiza una pila de 0..N
 * chips en vez de asumir 1 slot por celda.
 *
 * El eje de horas (columna izquierda) se arma como la UNIÓN ordenada de las
 * horas que efectivamente aparecen en los 7 días cargados — no se fabrica
 * un rango fijo (ej. "07:00 a 20:00" cada 20 min) porque la clínica no
 * necesariamente opera parejo todos los días/especialidades; fabricar un
 * rango fijo mostraría filas vacías de más. Mismo criterio que
 * `allHoras` en el componente interno.
 */

import { useEffect, useMemo, useState } from "react";

import { ApiError } from "@/api/client";
import { buscarSlots, type Slot } from "@/api/slots.api";
import ErrorAlert from "@/components/ErrorAlert";

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface DiaColumna {
  /** `YYYY-MM-DD`. */
  fecha: string;
  etiquetaDia: string;
  numeroDia: string;
  esHoy: boolean;
}

interface SlotsWeekCalendarProps {
  especialidadId: number | "";
  onSlotClick: (slot: Slot) => void;
}

/** `YYYY-MM-DD` en hora LOCAL — mismo criterio que `HomePage.tsx` (evita
 * que `toISOString()` corra la fecha un día por la zona horaria). */
function formatFechaLocal(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

/** Hoy + 6 días siguientes (mismo alcance que el selector que reemplaza). */
function generarDias(): DiaColumna[] {
  const hoy = new Date();
  const hoyStr = formatFechaLocal(hoy);

  return Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
    const fechaStr = formatFechaLocal(fecha);
    return {
      fecha: fechaStr,
      etiquetaDia: DIAS_SEMANA[fecha.getDay()],
      numeroDia: String(fecha.getDate()),
      esHoy: fechaStr === hoyStr,
    };
  });
}

function messageFor(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

export default function SlotsWeekCalendar({ especialidadId, onSlotClick }: SlotsWeekCalendarProps) {
  const dias = useMemo(generarDias, []);

  const [slotsPorDia, setSlotsPorDia] = useState<Record<string, Slot[]> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setLoading(true);
    setError(null);

    Promise.all(
      dias.map((d) =>
        buscarSlots({
          fecha: d.fecha,
          especialidadId: especialidadId === "" ? undefined : especialidadId,
        }).then((slots) => [d.fecha, slots] as const),
      ),
    )
      .then((entradas) => {
        if (!activo) return;
        setSlotsPorDia(Object.fromEntries(entradas));
      })
      .catch((err) => {
        if (activo) setError(messageFor(err));
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [dias, especialidadId]);

  // Eje de horas: unión ordenada de las horas que aparecen en cualquiera
  // de los 7 días cargados (ver nota de diseño arriba).
  const horasEje = useMemo(() => {
    if (!slotsPorDia) return [];
    const set = new Set<string>();
    Object.values(slotsPorDia).forEach((slots) => slots.forEach((s) => set.add(s.hora)));
    return Array.from(set).sort();
  }, [slotsPorDia]);

  const conteoPorDia = useMemo(() => {
    const acc: Record<string, { disponibles: number; ocupados: number }> = {};
    for (const d of dias) {
      const slots = slotsPorDia?.[d.fecha] ?? [];
      acc[d.fecha] = {
        disponibles: slots.filter((s) => s.estado === "disponible").length,
        ocupados: slots.filter((s) => s.estado === "ocupado").length,
      };
    }
    return acc;
  }, [slotsPorDia, dias]);

  if (error) {
    return <ErrorAlert message={error} />;
  }

  if (loading && !slotsPorDia) {
    return <p className="text-sm text-slate-500">Buscando horarios de la semana…</p>;
  }

  return (
    <div className="relative">
      {loading && slotsPorDia && (
        <div className="absolute inset-0 z-10 flex items-start justify-center rounded-lg bg-white/70 pt-10 backdrop-blur-[1px]">
          <p className="text-sm font-medium text-slate-600">Actualizando…</p>
        </div>
      )}

      {/* Leyenda */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded border border-emerald-300 bg-emerald-50" />
          <span className="font-medium text-emerald-700">Disponible</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded border border-red-300 bg-red-50" />
          <span className="font-medium text-red-600">Ocupado</span>
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[720px]">
          {/* Cabecera de días */}
          <div className="mb-2 grid gap-1" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
            <div />
            {dias.map((d) => {
              const conteo = conteoPorDia[d.fecha];
              return (
                <div
                  key={d.fecha}
                  className={`rounded-lg py-2 text-center ${
                    d.esHoy ? "bg-slate-800" : "bg-slate-100"
                  }`}
                >
                  <p
                    className={`text-xs font-bold uppercase tracking-wide ${
                      d.esHoy ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {d.etiquetaDia}
                  </p>
                  <p className={`mt-0.5 text-sm font-semibold ${d.esHoy ? "text-white" : "text-slate-800"}`}>
                    {d.numeroDia}
                  </p>
                  {d.esHoy && (
                    <span className="mt-1 inline-block rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-800">
                      Hoy
                    </span>
                  )}
                  {slotsPorDia && (
                    <p className={`mt-1 text-[10px] ${d.esHoy ? "text-slate-200" : "text-slate-500"}`}>
                      {conteo.disponibles} libres
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grilla de horarios */}
          {!slotsPorDia ? null : horasEje.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-slate-500">
                No hay horarios para los próximos días{especialidadId !== "" ? " con esa especialidad" : ""}.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {horasEje.map((hora) => (
                <div
                  key={hora}
                  className="grid items-stretch gap-1"
                  style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}
                >
                  <div className="flex items-start justify-end pr-2 pt-3">
                    <span className="font-mono text-xs font-semibold text-slate-400">{hora}</span>
                  </div>

                  {dias.map((d) => {
                    const slotsCelda = (slotsPorDia[d.fecha] ?? []).filter((s) => s.hora === hora);

                    if (slotsCelda.length === 0) {
                      return (
                        <div
                          key={d.fecha}
                          className="min-h-[3rem] rounded-lg border border-dashed border-slate-200"
                        />
                      );
                    }

                    return (
                      <div key={d.fecha} className="flex flex-col gap-1">
                        {slotsCelda.map((slot) =>
                          slot.estado === "disponible" ? (
                            <button
                              key={slot.slotId}
                              type="button"
                              onClick={() => onSlotClick(slot)}
                              title={`${slot.hora} · Disponible · ${slot.especialidadPrincipal}${
                                slot.medicoNombre ? ` · ${slot.medicoNombre}` : ""
                              }`}
                              className="flex min-h-[3rem] flex-col justify-center gap-0.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1.5 text-left transition-colors hover:border-emerald-400 hover:bg-emerald-100 active:scale-[0.98]"
                            >
                              <span className="text-xs font-bold text-emerald-700">{slot.hora}</span>
                              <span className="truncate text-[10px] text-emerald-600/80">
                                {slot.especialidadPrincipal}
                              </span>
                            </button>
                          ) : (
                            // Ocupado: NO clickable (sin onClick, cursor deshabilitado, sin
                            // hover) y NUNCA muestra info de paciente/folio — solo la hora.
                            <div
                              key={slot.slotId}
                              title={`${slot.hora} · Ocupado`}
                              className="flex min-h-[3rem] cursor-not-allowed flex-col justify-center gap-0.5 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5"
                            >
                              <span className="text-xs font-bold text-red-600">{slot.hora}</span>
                              <span className="text-[10px] text-red-500/80">Ocupado</span>
                            </div>
                          ),
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
