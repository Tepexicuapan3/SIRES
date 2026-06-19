import { useQuery } from "@tanstack/react-query";
import { consumosAPI } from "@api/resources/almacen/kardex.api";
import type { ConsumosListParams } from "@api/types";
import { consumosKeys } from "./consumos.keys";

export function useConsumosList(params: ConsumosListParams) {
  return useQuery({
    queryKey: consumosKeys.list(params),
    queryFn:  () => consumosAPI.list(params),
  });
}
