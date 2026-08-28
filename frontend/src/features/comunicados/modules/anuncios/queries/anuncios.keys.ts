import type { AnunciosListParams } from "@features/comunicados/modules/anuncios/domain/anuncios.schemas";

export const anunciosKeys = {
  all: ["comunicados", "anuncios"] as const,
  lists: () => [...anunciosKeys.all, "list"] as const,
  list: (params?: AnunciosListParams) =>
    [...anunciosKeys.lists(), params ?? {}] as const,
  details: () => [...anunciosKeys.all, "detail"] as const,
  detail: (id: number) => [...anunciosKeys.details(), id] as const,
};
