import { useQuery } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";

const SOMATOMETRIA_HISTORIAL_KEY = "somatometria-historial";

export interface UseSomatometriaHistorialParams {
  page: number;
  pageSize?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  /** Filtro real de backend (D13/D3, somatometria-modulo-integral) --
   * reemplaza el filtrado client-side que existia antes sobre `centroId`. */
  centroId?: number;
}

interface UseSomatometriaHistorialOptions {
  enabled?: boolean;
}

/** Historial de visitas con signos vitales ya capturados -- fetch por rango
 * de fecha (y opcionalmente centro) via `GET /visits` (mismo endpoint que la
 * bandeja historica de recepcion, ver `RecepcionAgendaPage.tsx`). El filtro
 * de centro ahora viaja como parametro real de backend (`centroId`, ya
 * soportado por `VisitRepository.list_paginated`) -- el filtrado por "tiene
 * vitales" sigue siendo client-side en el componente que consume este hook,
 * porque el backend no distingue "con/sin vitales" como filtro de query. */
export const useSomatometriaHistorial = (
  params: UseSomatometriaHistorialParams,
  options: UseSomatometriaHistorialOptions = {},
) => {
  const { page, pageSize = 50, fechaDesde, fechaHasta, centroId } = params;

  return useQuery({
    queryKey: [
      SOMATOMETRIA_HISTORIAL_KEY,
      page,
      pageSize,
      fechaDesde,
      fechaHasta,
      centroId,
    ],
    queryFn: () =>
      visitsAPI.getAll({
        page,
        pageSize,
        fechaDesde,
        fechaHasta,
        centroId,
      }),
    enabled: options.enabled ?? true,
    staleTime: 30_000,
  });
};
