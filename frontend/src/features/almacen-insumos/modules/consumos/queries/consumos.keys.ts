export const consumosKeys = {
  all:    () => ["almacen", "consumos"] as const,
  list:   (params: object) => [...consumosKeys.all(), "list", params] as const,
  detail: (id: number)     => [...consumosKeys.all(), "detail", id] as const,
};
