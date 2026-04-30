import { useCentroAreasClinicasList } from "@features/admin/modules/catalogos/areas-clinicas/queries/useCentroAreasClinicasList";

interface AreaClinicaOption {
  id: number;
  name: string;
}

interface UseAreaClinicasByClinicResult {
  options: AreaClinicaOption[];
  isLoading: boolean;
}

/**
 * When a clinic is selected, returns only the areas associated with that clinic
 * via the centro_area_clinica table. Falls back to allOptions when no clinic is selected.
 */
export function useAreaClinicasByClinic(
  clinicId: number | null | undefined,
  allOptions: AreaClinicaOption[],
): UseAreaClinicasByClinicResult {
  const { data, isLoading } = useCentroAreasClinicasList(
    { centerId: clinicId ?? undefined, pageSize: 100 },
    { enabled: !!clinicId },
  );

  if (!clinicId) {
    return { options: allOptions, isLoading: false };
  }

  const options = (data?.items ?? []).map((item) => ({
    id: item.areaClinica.id,
    name: item.areaClinica.name,
  }));

  return { options, isLoading };
}
