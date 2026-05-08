import { useQuery } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";

export const useCdLaboralesList = (enabled = true) =>
  useQuery({
    queryKey: ["users", "cd-laborales"],
    queryFn: () => usersAPI.getCdLaborales(),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
