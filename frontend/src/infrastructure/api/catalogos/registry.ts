export const CATALOGOS = {
  CENTROS_ATENCION: "centros-atencion",
  AREAS: "areas",
  CIES: "cies",
} as const;

export type CatalogoKey = (typeof CATALOGOS)[keyof typeof CATALOGOS];
