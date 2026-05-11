import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import type { UpdateUserPerfilRequest } from "@api/types";

const perfilKey = (userId: number) => ["users", userId, "perfil"] as const;

export const useUserPerfil = (userId: number | undefined, enabled = true) =>
  useQuery({
    queryKey: perfilKey(userId!),
    queryFn: () => usersAPI.getPerfil(userId!),
    enabled: enabled && !!userId,
    staleTime: 60 * 1000,
  });

export const useUpdateUserPerfil = (userId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserPerfilRequest) => usersAPI.updatePerfil(userId, data),
    onSuccess: (response) => {
      queryClient.setQueryData(perfilKey(userId), response);
    },
  });
};
