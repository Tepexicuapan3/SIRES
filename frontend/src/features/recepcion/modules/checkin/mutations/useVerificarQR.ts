import { useMutation } from "@tanstack/react-query";
import { citasAPI } from "@api/resources/citas.api";

/**
 * Valida el payload firmado del QR y devuelve la ficha de la cita para que
 * recepción confirme visualmente al paciente. Sin efectos secundarios en el
 * backend (no crea Visit, no toca la cita) — se modela como mutation (no
 * query) porque cada escaneo es un payload distinto que no tiene sentido
 * cachear por clave.
 */
export const useVerificarQR = () =>
  useMutation({
    mutationFn: (payload: string) => citasAPI.verificarQR(payload),
  });
