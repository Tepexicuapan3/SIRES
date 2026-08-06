import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkinAPI } from "@api/resources/checkin.api";
import { visitFlowKeys } from "@features/recepcion/shared/queries/visit-flow.keys";

/**
 * Confirma el check-in a partir de un folio ya resuelto por el buscador de
 * nombre/folio (`POST /citas/checkin/confirmar-folio`) — mismo efecto en el
 * backend que el check-in por QR (crea el Visit, sella la cita como
 * verificada), así que reusa las mismas invalidaciones que
 * `useConfirmarQRCheckin`.
 */
export const useConfirmarFolioCheckin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folio: string) => checkinAPI.confirmarFolio(folio),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: visitFlowKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["agenda-semanal"] });
    },
  });
};
