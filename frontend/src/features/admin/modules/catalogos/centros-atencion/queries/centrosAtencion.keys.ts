import type { CentrosAtencionListParams } from "@api/types";

export const centrosAtencionKeys = {
  all: ["admin", "catalogos", "centros-atencion"] as const,
  list: (params?: CentrosAtencionListParams) =>
    params
      ? ([...centrosAtencionKeys.all, "list", params] as const)
      : ([...centrosAtencionKeys.all, "list"] as const),
  detail: (id: number) => [...centrosAtencionKeys.all, "detail", id] as const,
};
