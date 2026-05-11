import { useQuery } from "@tanstack/react-query";
import apiClient from "@api/client";

interface CalidadLaboralItem {
  id: string;
  name: string;
  isActive: boolean;
}

const fetchCalidadLaboral = async (): Promise<CalidadLaboralItem[]> => {
  const response = await apiClient.get<{ items: CalidadLaboralItem[] }>(
    "/labor-quality/",
    { params: { pageSize: 100, isActive: true } },
  );
  return response.data.items ?? [];
};

export const useCalidadLaboralList = (enabled = true) =>
  useQuery({
    queryKey: ["catalogos", "calidad-laboral"],
    queryFn: fetchCalidadLaboral,
    staleTime: 10 * 60 * 1000,
    enabled,
  });
