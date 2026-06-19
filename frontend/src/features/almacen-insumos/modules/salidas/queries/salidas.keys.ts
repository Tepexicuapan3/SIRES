export const salidasKeys = {
  all:    () => ["almacen", "salidas"] as const,
  list:   (params: object) => [...salidasKeys.all(), "list", params] as const,
  detail: (id: number)     => [...salidasKeys.all(), "detail", id] as const,
};
