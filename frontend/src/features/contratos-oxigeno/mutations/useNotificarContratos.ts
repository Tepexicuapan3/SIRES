import { useMutation } from "@tanstack/react-query";
import { contratosAPI } from "@api/resources/contratos.api";
import type { NotificarRequest } from "@api/types";

export const useNotificarContratos = () =>
  useMutation({
    mutationFn: ({ payload, adjuntos }: { payload: NotificarRequest; adjuntos?: File[] }) =>
      contratosAPI.notificar(payload, adjuntos),
  });
