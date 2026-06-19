import { useMutation, useQueryClient } from "@tanstack/react-query";
import { entradasAPI } from "@api/resources/almacen/kardex.api";
import { entradasKeys } from "../queries/entradas.keys";
import { kardexKeys } from "../../kardex/queries/kardex.keys";

export function useCreateEntrada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: entradasAPI.create,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: entradasKeys.all() });
      void qc.invalidateQueries({ queryKey: kardexKeys.all() });
    },
  });
}
