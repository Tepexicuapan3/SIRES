import type { PermissionEffect, UserOverride, UserRole } from "@api/types";

const normalizeExpiresAt = (value: string | null | undefined) => {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.includes("T") ? normalized.split("T")[0] : normalized;
};

const getPrimaryRoleId = (roles: UserRole[]) =>
  roles.find((role) => role.isPrimary)?.id ?? null;

const sortNumeric = (values: number[]) => [...values].sort((a, b) => a - b);

export const areUserRolesEquivalent = (
  current: UserRole[],
  draft: UserRole[],
) => {
  if (current.length !== draft.length) return false;

  const currentIds = sortNumeric(current.map((role) => role.id));
  const draftIds = sortNumeric(draft.map((role) => role.id));

  if (currentIds.some((id, index) => id !== draftIds[index])) {
    return false;
  }

  return getPrimaryRoleId(current) === getPrimaryRoleId(draft);
};

export interface UserRolesDiff {
  toAdd: number[];
  toRemove: number[];
  primaryRoleId: number | null;
  shouldSetPrimary: boolean;
}

export const buildUserRolesDiff = (
  current: UserRole[],
  draft: UserRole[],
): UserRolesDiff => {
  const currentIds = new Set(current.map((role) => role.id));
  const draftIds = new Set(draft.map((role) => role.id));

  const toAdd = sortNumeric(
    [...draftIds].filter((roleId) => !currentIds.has(roleId)),
  );
  const toRemove = sortNumeric(
    [...currentIds].filter((roleId) => !draftIds.has(roleId)),
  );

  const currentPrimaryRoleId = getPrimaryRoleId(current);
  const draftPrimaryRoleId = getPrimaryRoleId(draft);

  return {
    toAdd,
    toRemove,
    primaryRoleId: draftPrimaryRoleId,
    shouldSetPrimary:
      draftPrimaryRoleId !== null &&
      draftPrimaryRoleId !== currentPrimaryRoleId,
  };
};

interface ComparableOverride {
  effect: PermissionEffect;
  expiresAt: string | null;
}

const toComparableOverridesMap = (overrides: UserOverride[]) => {
  return new Map<string, ComparableOverride>(
    overrides.map((override) => [
      override.permissionCode,
      {
        effect: override.effect,
        expiresAt: normalizeExpiresAt(override.expiresAt),
      },
    ]),
  );
};

export const areUserOverridesEquivalent = (
  current: UserOverride[],
  draft: UserOverride[],
) => {
  if (current.length !== draft.length) return false;

  const currentMap = toComparableOverridesMap(current);
  const draftMap = toComparableOverridesMap(draft);

  if (currentMap.size !== draftMap.size) return false;

  for (const [permissionCode, currentOverride] of currentMap) {
    const draftOverride = draftMap.get(permissionCode);
    if (!draftOverride) return false;
    if (currentOverride.effect !== draftOverride.effect) return false;
    if (currentOverride.expiresAt !== draftOverride.expiresAt) return false;
  }

  return true;
};

export interface UserOverrideUpsertPayload {
  permissionCode: string;
  effect: PermissionEffect;
  expiresAt?: string;
}

export interface UserOverridesDiff {
  toUpsert: UserOverrideUpsertPayload[];
  toRemove: string[];
}

export const buildUserOverridesDiff = (
  current: UserOverride[],
  draft: UserOverride[],
): UserOverridesDiff => {
  const currentMap = toComparableOverridesMap(current);
  const draftMap = toComparableOverridesMap(draft);

  const toUpsert: UserOverrideUpsertPayload[] = [];

  for (const [permissionCode, draftOverride] of draftMap) {
    const currentOverride = currentMap.get(permissionCode);

    if (
      !currentOverride ||
      currentOverride.effect !== draftOverride.effect ||
      currentOverride.expiresAt !== draftOverride.expiresAt
    ) {
      toUpsert.push({
        permissionCode,
        effect: draftOverride.effect,
        expiresAt: draftOverride.expiresAt ?? undefined,
      });
    }
  }

  const toRemove = [...currentMap.keys()]
    .filter((permissionCode) => !draftMap.has(permissionCode))
    .sort((first, second) => first.localeCompare(second));

  return { toUpsert, toRemove };
};
