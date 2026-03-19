import apiClient from "@/api/client";
import type { EnfermedadListItem } from "@/api/types/catalogos/enfermedades.types";

export const EnfermedadesResource = {
  list: async (): Promise<EnfermedadListItem[]> => {
    const { data } = await apiClient.get<any[]>(
      "/catalogos/enfermedades/"
    );

    return data.map((e) => ({
      id: e.id,
      code: e.code,
      name: e.name,
      cieVersion: e.cie_version,
      isActive: e.is_active,
    }));
  },
};