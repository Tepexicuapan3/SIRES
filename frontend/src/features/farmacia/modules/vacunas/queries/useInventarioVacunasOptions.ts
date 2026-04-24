import { useQuery } from "@tanstack/react-query";
import { vacunasAPI } from "@api/resources/catalogos/vacunas.api";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";

export const useInventarioVacunasOptions = (enabled = true) => {
  const { data: vacunasData } = useQuery({
    queryKey: ["farmacia", "options", "vacunas"],
    queryFn: () => vacunasAPI.getAll({ pageSize: 100, isActive: true }),
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  const { data: centrosData } = useQuery({
    queryKey: ["farmacia", "options", "centros"],
    queryFn: () => centrosAtencionAPI.getAll({ pageSize: 100, isActive: true }),
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  return {
    vacunaOptions: (vacunasData?.items ?? []).map((v) => ({ id: v.id, name: v.name })),
    centroOptions: (centrosData?.items ?? []).map((c) => ({ id: c.id, name: c.name })),
  };
};
