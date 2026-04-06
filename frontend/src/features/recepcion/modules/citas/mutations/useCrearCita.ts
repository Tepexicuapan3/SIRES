// frontend/src/features/recepcion/modules/citas/mutations/useCrearCita.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as citasApi from "@/api/resources/citas.api";
import type { CrearCitaForm } from "../types/citas.types";
import { citasKeys } from "../queries/citas.keys";

export function useCrearCita() {
    const qc = useQueryClient();

    return useMutation({
    mutationFn: (data: CrearCitaForm) => citasApi.crearCita(data),
    onSuccess: () => {
        qc.invalidateQueries({ queryKey: citasKeys.all });
        toast.success("Cita agendada exitosamente.");
    },
    onError: (err: any) => {
        const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.non_field_errors?.[0] ??
        "Error al agendar la cita.";
        toast.error(msg);
    },
    });
}