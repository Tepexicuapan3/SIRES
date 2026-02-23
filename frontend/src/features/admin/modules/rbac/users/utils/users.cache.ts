import type { QueryClient } from "@tanstack/react-query";
import type {
  UserDetail,
  UserDetailResponse,
  UserListItem,
  UserOverride,
  UserRole,
  UsersListResponse,
} from "@api/types";
import { usersKeys } from "@features/admin/modules/rbac/users/queries/users.keys";

// Sync sub-recursos sin invalidar listados completos.

const getPrimaryRoleName = (roles: UserRole[]) =>
  roles.find((role) => role.isPrimary)?.name ?? roles[0]?.name ?? "";

const mapDetailToListPatch = (user: UserDetail): Partial<UserListItem> => ({
  username: user.username,
  fullname: user.fullname,
  email: user.email,
  clinic: user.clinic,
  primaryRole: user.primaryRole,
  isActive: user.isActive,
  termsAccepted: user.termsAccepted,
  mustChangePassword: user.mustChangePassword,
});

const updateUserDetailCache = (
  queryClient: QueryClient,
  userId: number,
  updater: (current: UserDetailResponse) => UserDetailResponse,
) => {
  queryClient.setQueryData<UserDetailResponse>(
    usersKeys.detail(userId),
    (current) => {
      if (!current) return current;
      return updater(current);
    },
  );
};

const updateUsersListCache = (
  queryClient: QueryClient,
  userId: number,
  updater: (current: UserListItem) => UserListItem,
) => {
  queryClient.setQueriesData<UsersListResponse>(
    { queryKey: usersKeys.list() },
    (current) => {
      if (!current) return current;
      return {
        ...current,
        items: current.items.map((item) =>
          item.id === userId ? updater(item) : item,
        ),
      };
    },
  );
};

export const syncUserRolesCache = (
  queryClient: QueryClient,
  userId: number,
  roles: UserRole[],
) => {
  const primaryRole = getPrimaryRoleName(roles);

  updateUserDetailCache(queryClient, userId, (current) => ({
    ...current,
    roles,
    user: {
      ...current.user,
      primaryRole: primaryRole || current.user.primaryRole,
    },
  }));

  updateUsersListCache(queryClient, userId, (item) => ({
    ...item,
    primaryRole: primaryRole || item.primaryRole,
  }));
};

export const syncUserOverridesCache = (
  queryClient: QueryClient,
  userId: number,
  overrides: UserOverride[],
) => {
  updateUserDetailCache(queryClient, userId, (current) => ({
    ...current,
    overrides,
  }));
};

export const syncUserStatusCache = (
  queryClient: QueryClient,
  userId: number,
  isActive: boolean,
) => {
  updateUserDetailCache(queryClient, userId, (current) => ({
    ...current,
    user: {
      ...current.user,
      isActive,
    },
  }));

  updateUsersListCache(queryClient, userId, (item) => ({
    ...item,
    isActive,
  }));
};

export const syncUserProfileCache = (
  queryClient: QueryClient,
  user: UserDetail,
) => {
  updateUserDetailCache(queryClient, user.id, (current) => ({
    ...current,
    user: {
      ...current.user,
      ...user,
    },
  }));

  updateUsersListCache(queryClient, user.id, (item) => ({
    ...item,
    ...mapDetailToListPatch(user),
  }));
};
