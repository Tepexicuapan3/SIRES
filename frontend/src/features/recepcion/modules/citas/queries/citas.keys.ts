// frontend/src/features/recepcion/modules/citas/queries/citas.keys.ts

import type { FiltrosCitas } from "../types/citas.types";

export const citasKeys = {
    all:            ["recepcion", "citas"] as const,
    lists:          () => [...citasKeys.all, "list"] as const,
    list:           (filtros: FiltrosCitas) => [...citasKeys.lists(), filtros] as const,
    details:        () => [...citasKeys.all, "detail"] as const,
    detail:         (id: string) => [...citasKeys.details(), id] as const,
    nucleoFamiliar: (noExp: number) => [...citasKeys.all, "nucleo", noExp] as const,
    disponibilidad: (medicoId: number, desde?: string, hasta?: string) =>
    [...citasKeys.all, "disponibilidad", medicoId, desde, hasta] as const,
} as const;