import { useQuery } from "@tanstack/react-query";
import {
  almacenesAPI,
  categoriasInsumoAPI,
  insumosAPI,
  proveedoresAPI,
  unidadesMedidaAPI,
} from "@api/resources/almacen/catalogos.api";
import type { AlmacenesListParams, CatalogosBaseListParams, InsumosListParams } from "@api/types";
import {
  almacenesKeys,
  categoriasInsumoKeys,
  insumosKeys,
  proveedoresKeys,
  unidadesMedidaKeys,
} from "./catalogos.keys";

interface Options { enabled?: boolean }

export const useUnidadesMedidaList = (params?: CatalogosBaseListParams, opts: Options = {}) =>
  useQuery({
    queryKey: unidadesMedidaKeys.list(params),
    queryFn:  () => unidadesMedidaAPI.getAll(params),
    staleTime: 5 * 60 * 1000,
    enabled:  opts.enabled ?? true,
  });

export const useCategoriasInsumoList = (params?: CatalogosBaseListParams, opts: Options = {}) =>
  useQuery({
    queryKey: categoriasInsumoKeys.list(params),
    queryFn:  () => categoriasInsumoAPI.getAll(params),
    staleTime: 5 * 60 * 1000,
    enabled:  opts.enabled ?? true,
  });

export const useProveedoresList = (params?: CatalogosBaseListParams, opts: Options = {}) =>
  useQuery({
    queryKey: proveedoresKeys.list(params),
    queryFn:  () => proveedoresAPI.getAll(params),
    staleTime: 5 * 60 * 1000,
    enabled:  opts.enabled ?? true,
  });

export const useInsumosList = (params?: InsumosListParams, opts: Options = {}) =>
  useQuery({
    queryKey: insumosKeys.list(params),
    queryFn:  () => insumosAPI.getAll(params),
    staleTime: 2 * 60 * 1000,
    enabled:  opts.enabled ?? true,
  });

export const useAlmacenesList = (params?: AlmacenesListParams, opts: Options = {}) =>
  useQuery({
    queryKey: almacenesKeys.list(params),
    queryFn:  () => almacenesAPI.getAll(params),
    staleTime: 5 * 60 * 1000,
    enabled:  opts.enabled ?? true,
  });
