export const CATALOGOS = {
  CENTROS_ATENCION: "centros-atencion",
  AREAS: "areas",
} as const;

export type CatalogoKey = (typeof CATALOGOS)[keyof typeof CATALOGOS];
