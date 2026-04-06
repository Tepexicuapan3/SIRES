// frontend/src/features/recepcion/modules/citas/queries/useCitasQueries.ts
// Agrupa los 3 hooks de lectura. Puedes separarlos en archivos individuales
// si prefieres el patrón de las áreas (useNucleoFamiliar.ts, etc.)

import { useQuery } from "@tanstack/react-query";
import * as citasApi from "@/api/resources/citas.api";
import type { FiltrosCitas } from "../types/citas.types";
import { citasKeys } from "./citas.keys";

// ── Núcleo familiar (trabajador + derechohabientes) ───────────────────────────

export function useNucleoFamiliar(noExp: number | null) {
    return useQuery({
    queryKey:  citasKeys.nucleoFamiliar(noExp!),
    queryFn:   () => citasApi.getNucleoFamiliar(noExp!),
    enabled:   noExp !== null && noExp > 0,
    staleTime: 5 * 60_000,   // 5 min
    });
}

// ── Disponibilidad de un médico ───────────────────────────────────────────────

export function useDisponibilidad(
    medicoId: number | null,
    fechaInicio?: string,
    fechaFin?: string
) {
    return useQuery({
    queryKey: citasKeys.disponibilidad(medicoId!, fechaInicio, fechaFin),
    queryFn:  () =>
        citasApi.getDisponibilidad({
        medico_id:    medicoId!,
        fecha_inicio: fechaInicio,
        fecha_fin:    fechaFin,
        }),
    enabled:   medicoId !== null && medicoId > 0,
    staleTime: 60_000,   // 1 min
    });
}

// ── Lista de citas (dashboard recepcionista) ──────────────────────────────────

export function useListarCitas(filtros: FiltrosCitas) {
    return useQuery({
    queryKey:        citasKeys.list(filtros),
    queryFn:         () => citasApi.listarCitas(filtros),
    placeholderData: (prev) => prev,   // mantiene datos anteriores durante refetch
    });
}