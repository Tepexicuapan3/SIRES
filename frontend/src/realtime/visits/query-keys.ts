import type { VisitsListParams } from "@api/types";

export const visitFlowKeys = {
  all: ["visit-flow"] as const,
  lists: () => [...visitFlowKeys.all, "list"] as const,
  list: (params?: VisitsListParams) =>
    [...visitFlowKeys.lists(), params] as const,
};
