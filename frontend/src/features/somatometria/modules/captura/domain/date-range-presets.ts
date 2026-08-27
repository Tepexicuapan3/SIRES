/**
 * Presets de rango de fecha calculados en tiempo LOCAL del dispositivo
 * (D12, somatometria-modulo-integral).
 *
 * Reemplaza el `todayIso()` que usaba `toISOString()` (UTC) en
 * `SomatometriaHistorialView.tsx` -- ese enfoque corria el dia calendario
 * cerca de medianoche para cualquier usuario en una zona horaria distinta a
 * UTC+0 (ej. Mexico, UTC-6): a las 23:50 hora local, `toISOString()` ya
 * devuelve el dia SIGUIENTE en UTC.
 *
 * Modulo puro -- sin dependencias de React ni del reloj global salvo el
 * parametro `now` inyectable (facilita testear "23:50 hora local" sin mockear
 * `Date` globalmente).
 */

export type DateRangePreset = "hoy" | "semana" | "mes" | "anio";

export interface DateRange {
  fechaDesde: string;
  fechaHasta: string;
}

const pad = (value: number): string => String(value).padStart(2, "0");

/** Fecha calendario LOCAL en formato `YYYY-MM-DD` -- NUNCA `toISOString()`. */
const toLocalIso = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Lunes de la semana calendario LOCAL que contiene `now`. `Date.getDay()`
 * devuelve 0=domingo..6=sabado; se normaliza para que la semana empiece
 * siempre en lunes, sin importar el dia de la semana de `now`. */
const startOfLocalWeek = (now: Date): Date => {
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - diffToMonday);
  return monday;
};

/**
 * Resuelve `{fechaDesde, fechaHasta}` para un preset, en calendario LOCAL.
 * `now` es inyectable (default `new Date()`) para tests deterministicos.
 */
export const resolvePreset = (
  preset: DateRangePreset,
  now: Date = new Date(),
): DateRange => {
  const fechaHasta = toLocalIso(now);

  switch (preset) {
    case "hoy":
      return { fechaDesde: fechaHasta, fechaHasta };
    case "semana":
      return { fechaDesde: toLocalIso(startOfLocalWeek(now)), fechaHasta };
    case "mes":
      return {
        fechaDesde: toLocalIso(new Date(now.getFullYear(), now.getMonth(), 1)),
        fechaHasta,
      };
    case "anio":
      return {
        fechaDesde: toLocalIso(new Date(now.getFullYear(), 0, 1)),
        fechaHasta,
      };
    default: {
      const exhaustiveCheck: never = preset;
      throw new Error(`Preset de fecha desconocido: ${String(exhaustiveCheck)}`);
    }
  }
};

/**
 * Valida un rango personalizado ANTES de enviarlo al backend. Un rango
 * incompleto (falta alguna fecha) se considera válido aquí -- no hay nada
 * que rechazar todavía; la UI decide si exige ambas fechas para habilitar
 * el filtro. Comparación lexicográfica sobre `YYYY-MM-DD` es válida porque
 * el formato es de ancho fijo y orden creciente.
 */
export const isValidCustomRange = (
  fechaDesde: string,
  fechaHasta: string,
): boolean => {
  if (!fechaDesde || !fechaHasta) return true;
  return fechaDesde <= fechaHasta;
};
