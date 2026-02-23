const BADGE_VARIANT = {
  BRAND: "brand",
  SECONDARY: "secondary",
  CRITICAL: "critical",
  ALERT: "alert",
  STABLE: "stable",
  INFO: "info",
} as const;

export type RoleBadgeVariant =
  (typeof BADGE_VARIANT)[keyof typeof BADGE_VARIANT];

const ROLE_BADGE_GROUP = {
  ADMIN: BADGE_VARIANT.BRAND,
  CLINICO: BADGE_VARIANT.INFO,
  RECEPCION: BADGE_VARIANT.ALERT,
  FARMACIA: BADGE_VARIANT.STABLE,
  URGENCIAS: BADGE_VARIANT.CRITICAL,
} as const;

const DEFAULT_ROLE_BADGE_VARIANT = BADGE_VARIANT.SECONDARY;

export const getRoleBadgeVariant = (
  role: string | null | undefined,
): RoleBadgeVariant => {
  const normalized = role?.trim().toUpperCase();
  if (!normalized) return DEFAULT_ROLE_BADGE_VARIANT;

  const entries = Object.entries(ROLE_BADGE_GROUP) as Array<
    [keyof typeof ROLE_BADGE_GROUP, RoleBadgeVariant]
  >;

  for (const [prefix, variant] of entries) {
    if (normalized === prefix || normalized.startsWith(prefix)) {
      return variant;
    }
  }

  return DEFAULT_ROLE_BADGE_VARIANT;
};
