import type { AlmacenesListParams, CatalogosBaseListParams, InsumosListParams } from "@api/types";

export const unidadesMedidaKeys = {
  all:  ["almacen", "unidades-medida"] as const,
  list: (params?: CatalogosBaseListParams) => [...unidadesMedidaKeys.all, "list", params] as const,
};

export const categoriasInsumoKeys = {
  all:  ["almacen", "categorias"] as const,
  list: (params?: CatalogosBaseListParams) => [...categoriasInsumoKeys.all, "list", params] as const,
};

export const proveedoresKeys = {
  all:  ["almacen", "proveedores"] as const,
  list: (params?: CatalogosBaseListParams) => [...proveedoresKeys.all, "list", params] as const,
};

export const insumosKeys = {
  all:  ["almacen", "insumos"] as const,
  list: (params?: InsumosListParams) => [...insumosKeys.all, "list", params] as const,
};

export const almacenesKeys = {
  all:  ["almacen", "almacenes"] as const,
  list: (params?: AlmacenesListParams) => [...almacenesKeys.all, "list", params] as const,
};
