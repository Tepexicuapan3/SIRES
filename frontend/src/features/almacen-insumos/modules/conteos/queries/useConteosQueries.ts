import { useQuery } from "@tanstack/react-query";
import { conteosAPI } from "@api/resources/almacen/kardex.api";
import type { ConteosListParams } from "@api/types";
import { conteosKeys } from "./conteos.keys";

export function useConteosList(params: ConteosListParams) {
  return useQuery({
    queryKey: conteosKeys.list(params),
    queryFn:  () => conteosAPI.list(params),
  });
}

export function useConteoDetail(id: number) {
  return useQuery({
    queryKey: conteosKeys.detail(id),
    queryFn:  () => conteosAPI.get(id),
    enabled:  !!id,
  });
}
