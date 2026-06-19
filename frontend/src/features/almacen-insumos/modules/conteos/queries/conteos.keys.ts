export const conteosKeys = {
  all:    () => ["almacen", "conteos"] as const,
  list:   (params: object) => [...conteosKeys.all(), "list", params] as const,
  detail: (id: number)     => [...conteosKeys.all(), "detail", id] as const,
};
