import { useQuery } from "@tanstack/react-query";
import { salidasAPI } from "@api/resources/almacen/kardex.api";
import type { SalidasListParams } from "@api/types";
import { salidasKeys } from "./salidas.keys";

export function useSalidasList(params: SalidasListParams) {
  return useQuery({
    queryKey: salidasKeys.list(params),
    queryFn:  () => salidasAPI.list(params),
  });
}
