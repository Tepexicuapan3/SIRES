import apiClient from "@api/client";
import type { EnfermedadListItem } from "@api/types/catalogos/enfermedades.types";

interface EnfermedadApiItem {
  id: number;
  code: string;
  name: string;
  cie_version: string;
  is_active: boolean;
}

export const EnfermedadesResource = {
  list: async (): Promise<EnfermedadListItem[]> => {
    const { data } = await apiClient.get<EnfermedadApiItem[]>(
      "/catalogos/enfermedades/",
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
