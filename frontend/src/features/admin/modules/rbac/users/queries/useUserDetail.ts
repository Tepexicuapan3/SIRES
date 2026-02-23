import { useQuery } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import type { UserDetailResponse } from "@api/types";
import { usersKeys } from "@features/admin/modules/rbac/users/queries/users.keys";

export const useUserDetail = (userId?: number, enabled = true) => {
  return useQuery<UserDetailResponse>({
    queryKey: usersKeys.detail(userId ?? 0),
    queryFn: () => usersAPI.getById(userId ?? 0),
    enabled: enabled && Boolean(userId),
    staleTime: 60 * 1000,
  });
};
