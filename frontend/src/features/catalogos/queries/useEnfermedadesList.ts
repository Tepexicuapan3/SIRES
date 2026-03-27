import { useQuery } from "@tanstack/react-query";
import { EnfermedadesResource } from "@api/resources/catalogos/enfermedades.resource";

const ENFERMEDADES_LIST_QUERY_KEY = [
  "catalogos",
  "enfermedades",
  "list",
] as const;

export const useEnfermedadesList = () => {
  return useQuery({
    queryKey: ENFERMEDADES_LIST_QUERY_KEY,
    queryFn: () => EnfermedadesResource.list(),
  });
};
