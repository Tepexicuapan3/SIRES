import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { expedientesAPI } from "@api/resources/expedientes.api";
import { expedientesKeys } from "../queries/expedientes.keys";

export const useActualizarExpediente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expedientesAPI.actualizar,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: expedientesKeys.detail(variables.expediente),
      });
      toast.success("Expediente sincronizado correctamente.");
    },
    onError: () => {
      toast.error("Error al sincronizar el expediente. Intenta nuevamente.");
    },
  });
};
