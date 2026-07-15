import type { SessionsListParams } from "@api/types";

export const sessionsKeys = {
  all: ["admin", "sessions"] as const,
  list: (params?: SessionsListParams) =>
    params
      ? ([...sessionsKeys.all, "list", params] as const)
      : ([...sessionsKeys.all, "list"] as const),
};
