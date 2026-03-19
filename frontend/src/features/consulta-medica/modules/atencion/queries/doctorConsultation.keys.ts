import type { CieSearchParams } from "@api/types";

export const doctorConsultationKeys = {
  all: ["doctor-consultation"] as const,
  ciesSearch: (params: CieSearchParams) =>
    [...doctorConsultationKeys.all, "cies-search", params] as const,
};
