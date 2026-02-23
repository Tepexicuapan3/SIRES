export {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/rbac/shared/utils/rbac-format";

const USER_UI_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type UserUiStatus = (typeof USER_UI_STATUS)[keyof typeof USER_UI_STATUS];

interface UserStatusSource {
  isActive?: boolean;
  termsAccepted?: boolean;
  mustChangePassword?: boolean;
}

export const resolveUserUiStatus = (user: UserStatusSource): UserUiStatus => {
  if (user.mustChangePassword || user.termsAccepted === false) {
    return USER_UI_STATUS.PENDING;
  }

  return user.isActive ? USER_UI_STATUS.ACTIVE : USER_UI_STATUS.INACTIVE;
};
