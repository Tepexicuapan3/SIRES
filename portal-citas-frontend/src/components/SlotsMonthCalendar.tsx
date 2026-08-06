/**
 * Calendario mensual de disponibilidad del portal (Fase 7 — reemplaza a
 * `SlotsWeekCalendar.tsx`, eliminado). El eje de búsqueda pasa de
 * "especialidad + semana de 7 días" a "consultorio + mes", siguiendo
 * `sdd/portal-citas-consultorios/design`.
 *
 * Flujo:
 *   1. Al montar (o cambiar `consultorioId`/mes visible) pide
 *      `GET /portal/consultorios/{id}/disponibilidad-mensual` — UNA
 *      consulta agregada por mes, nunca los slots individuales completos.
 *   2. El `DayPicker` pinta con un badge los días con cupo y deshabilita
 *      el resto (además de cualquier día anterior a hoy).
 *   3. Al elegir un día se pide `GET /portal/slots?fecha&consultorioId` y
 *      se listan las horas como chips — misma UI verde/rojo y mismo
 *      criterio de nunca exponer datos de paciente en un slot "ocupado"
 *      que tenía `SlotsWeekCalendar`.
 *
 * Ventana de navegación (`startMonth`/`endMonth`): el backend genera slots
 * ~30 días hacia adelante (`CitasRepository.generar_slots_medico`,
 * `dias_adelante=30` en el task periódico —
 * `backend/apps/recepcion/tasks.py`), pero eso es solo la ventana donde
 * HOY existen slots — no un límite de negocio. El usuario debe poder
 * navegar meses/años adelante para planificar con anticipación; los meses
 * sin cupo generado todavía simplemente se muestran vacíos (`dias: []` de
 * `disponibilidad-mensual`, ya soportado como estado normal). Por eso NO
 * se capa `endMonth` a esos 30 días: se deja un tope generoso de +2 años
 * desde hoy, solo para evitar una navegación literalmente infinita en el
 * `DayPicker`, sin restringir la planificación anticipada real.
 */

import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";

import { ApiError } from "@/api/client";
import { disponibilidadMensual } from "@/api/consultorios.api";
import { buscarSlots, type Slot } from "@/api/slots.api";
import ErrorAlert from "@/components/ErrorAlert";

/** Mismo criterio usado en todo el portal: `YYYY-MM-DD` en hora LOCAL,
 * evita que `toISOString()` corra la fecha un día por la zona horaria. */
function formatFechaLocal(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function inicioDeDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function messageFor(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

/** Tope de navegación hacia adelante en el calendario (ver nota de diseño
 * arriba) — no está atado a la ventana de generación real de slots. */
const ANIOS_NAVEGACION_ADELANTE = 2;

interface SlotsMonthCalendarProps {
  consultorioId: number;
  onSlotClick: (slot: Slot) => void;
}

export default function SlotsMonthCalendar({ consultorioId, onSlotClick }: SlotsMonthCalendarProps) {
  const hoy = inicioDeDia(new Date());
  const startMonth = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const endMonth = new Date(hoy.getFullYear() + ANIOS_NAVEGACION_ADELANTE, hoy.getMonth(), 1);

  const [mes, setMes] = useState<Date>(startMonth);
  const [diasDisponibles, setDiasDisponibles] = useState<Set<string>>(new Set());
  const [loadingMes, setLoadingMes] = useState(false);
  const [errorMes, setErrorMes] = useState<string | null>(null);

  const [diaElegido, setDiaElegido] = useState<Date | undefined>(undefined);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorSlots, setErrorSlots] = useState<string | null>(null);

  // Disponibilidad agregada del mes visible. Al cambiar `consultorioId` o de
  // mes, el día elegido (y sus horas) dejan de ser válidos.
  useEffect(() => {
    let activo = true;
    setDiaElegido(undefined);
    setSlots([]);
    setErrorSlots(null);
    setLoadingMes(true);
    setErrorMes(null);

    disponibilidadMensual(consultorioId, mes.getFullYear(), mes.getMonth() + 1)
      .then((dias) => {
        if (!activo) return;
        setDiasDisponibles(new Set(dias.map((d) => d.fecha)));
      })
      .catch((err) => {
        if (activo) setErrorMes(messageFor(err));
      })
      .finally(() => {
        if (activo) setLoadingMes(false);
      });

    return () => {
      activo = false;
    };
  }, [consultorioId, mes]);

  const tieneCupo = (dia: Date) => diasDisponibles.has(formatFechaLocal(dia));

  const handleSeleccionDia = (dia: Date | undefined) => {
    setDiaElegido(dia);
    setSlots([]);
    setErrorSlots(null);

    if (!dia) return;

    setLoadingSlots(true);
    buscarSlots({ fecha: formatFechaLocal(dia), consultorioId })
      .then(setSlots)
      .catch((err) => setErrorSlots(messageFor(err)))
      .finally(() => setLoadingSlots(false));
  };

  return (
    <div className="flex flex-col gap-4">
      {errorMes && <ErrorAlert message={errorMes} />}

      <div className="relative rounded-lg border border-line-hairline bg-paper p-2">
        {loadingMes && (
          <div className="absolute inset-0 z-10 flex items-start justify-center rounded-lg bg-paper/70 pt-10 backdrop-blur-[1px]">
            <p className="text-sm font-medium text-txt-muted">Cargando disponibilidad…</p>
          </div>
        )}

        {/* Leyenda: el badge (punto verde) indica día con cupo, ver `modifiersClassNames`. */}
        <div className="mb-1 flex flex-wrap items-center gap-4 px-2 pt-1 text-xs text-txt-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-status-stable" />
            <span className="font-medium text-status-stable">Día con cupo</span>
          </span>
        </div>

        <DayPicker
          mode="single"
          locale={es}
          month={mes}
          onMonthChange={setMes}
          startMonth={startMonth}
          endMonth={endMonth}
          selected={diaElegido}
          onSelect={handleSeleccionDia}
          disabled={[{ before: hoy }, (dia) => !tieneCupo(dia)]}
          modifiers={{ conCupo: tieneCupo }}
          modifiersClassNames={{
            conCupo:
              "relative after:absolute after:bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:bg-status-stable",
          }}
        />
      </div>

      {diaElegido && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-txt-body">
            Horarios disponibles el {formatFechaLocal(diaElegido)}
          </h3>

          {errorSlots && <ErrorAlert message={errorSlots} />}

          {loadingSlots && !errorSlots && (
            <p className="text-sm text-txt-muted">Buscando horarios…</p>
          )}

          {!loadingSlots && !errorSlots && slots.length === 0 && (
            <p className="text-sm text-txt-muted">No hay horarios para ese día.</p>
          )}

          {!loadingSlots && !errorSlots && slots.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {slots.map((slot) =>
                slot.estado === "disponible" ? (
                  <button
                    key={slot.slotId}
                    type="button"
                    onClick={() => onSlotClick(slot)}
                    title={`${slot.hora} · Disponible · ${slot.especialidadPrincipal}`}
                    className="flex flex-col justify-center gap-0.5 rounded-lg border border-status-stable/40 bg-status-stable/10 px-3 py-2 text-left transition-colors hover:border-status-stable/70 hover:bg-status-stable/20 active:scale-[0.98]"
                  >
                    <span className="text-sm font-bold text-status-stable">{slot.hora}</span>
                    <span className="truncate text-[10px] text-status-stable/80">
                      {slot.especialidadPrincipal}
                    </span>
                  </button>
                ) : (
                  // Ocupado: NO clickable y NUNCA muestra info de
                  // paciente/folio — solo la hora (mismo criterio que el
                  // calendario semanal que reemplaza este componente).
                  <div
                    key={slot.slotId}
                    title={`${slot.hora} · Ocupado`}
                    className="flex cursor-not-allowed flex-col justify-center gap-0.5 rounded-lg border border-status-critical/30 bg-status-critical/10 px-3 py-2"
                  >
                    <span className="text-sm font-bold text-status-critical">{slot.hora}</span>
                    <span className="text-[10px] text-status-critical/80">Ocupado</span>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
