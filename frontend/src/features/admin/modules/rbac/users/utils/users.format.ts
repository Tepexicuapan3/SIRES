export const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
  }).format(date);
};

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
