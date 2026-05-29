import { useMutation, useQuery } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import type { NotifyUsersRequest } from "@api/types";

interface NotifyPayload {
  data: NotifyUsersRequest;
  files?: File[];
}

export const useNotifyUsers = () =>
  useMutation({
    mutationFn: ({ data, files }: NotifyPayload) => usersAPI.notify(data, files),
  });

export const useNotifyUsersPreview = (data: NotifyUsersRequest | null) =>
  useQuery({
    queryKey: ["users-notify-preview", data],
    queryFn: () => usersAPI.notifyPreview(data!),
    enabled: data !== null,
    staleTime: 10_000,
    retry: false,
  });
