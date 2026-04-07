import type {
  Permission,
  RoleListItem,
  UserOverride,
  UserRole,
} from "@api/types";
import type { UserDetailsFormValues } from "@/domains/auth-access/types/rbac/users.schemas";

interface UserDetailFormSource {
  firstName?: string | null;
  paternalName?: string | null;
  maternalName?: string | null;
  email?: string | null;
  clinic?: { id: number } | null;
}

interface DraftAssigner {
  id: number;
  name: string;
}

interface AddOverrideToDraftParams {
  baseOverrides: UserOverride[];
  permissions: Permission[];
  permissionCode: string;
  nextOverrideId: number;
  assigner: DraftAssigner;
}

interface AddOverrideToDraftResult {
  overrides: UserOverride[];
  nextOverrideId: number;
}

export const mapUserDetailToFormValues = (
  detail?: UserDetailFormSource | null,
): UserDetailsFormValues => ({
  firstName: detail?.firstName ?? "",
  paternalName: detail?.paternalName ?? "",
  maternalName: detail?.maternalName ?? "",
  email: detail?.email ?? "",
  clinicId:
    typeof detail?.clinic?.id === "number" && detail.clinic.id > 0
      ? detail.clinic.id
      : null,
});

const normalizeDraftText = (value: string | null | undefined) =>
  (value ?? "").trim();

const normalizeDraftClinicId = (value: number | null | undefined) =>
  typeof value === "number" && value > 0 && !Number.isNaN(value) ? value : null;

export const buildUserProfilePayload = (
  baseline: UserDetailsFormValues,
  draft: UserDetailsFormValues,
): Partial<UserDetailsFormValues> => {
  const payload: Partial<UserDetailsFormValues> = {};

  if (
    normalizeDraftText(draft.firstName) !==
    normalizeDraftText(baseline.firstName)
  ) {
    payload.firstName = draft.firstName;
  }

  if (
    normalizeDraftText(draft.paternalName) !==
    normalizeDraftText(baseline.paternalName)
  ) {
    payload.paternalName = draft.paternalName;
  }

  if (
    normalizeDraftText(draft.maternalName) !==
    normalizeDraftText(baseline.maternalName)
  ) {
    payload.maternalName = draft.maternalName;
  }

  if (normalizeDraftText(draft.email) !== normalizeDraftText(baseline.email)) {
    payload.email = draft.email;
  }

  if (
    normalizeDraftClinicId(draft.clinicId) !==
    normalizeDraftClinicId(baseline.clinicId)
  ) {
    payload.clinicId = draft.clinicId;
  }

  return payload;
};

export const hasUserProfileChanges = (
  baseline: UserDetailsFormValues,
  draft: UserDetailsFormValues,
) => {
  return Object.keys(buildUserProfilePayload(baseline, draft)).length > 0;
};

export const addRoleToDraft = (
  baseRoles: UserRole[],
  roleOptions: RoleListItem[],
  roleId: number,
  assigner: DraftAssigner,
): UserRole[] => {
  const selectedRole = roleOptions.find((role) => role.id === roleId);
  if (!selectedRole) return baseRoles;
  if (baseRoles.some((role) => role.id === roleId)) return baseRoles;

  const hasPrimary = baseRoles.some((role) => role.isPrimary);

  return [
    ...baseRoles,
    {
      id: selectedRole.id,
      name: selectedRole.name,
      description: selectedRole.description,
      isPrimary: !hasPrimary,
      assignedAt: new Date().toISOString(),
      assignedBy: { ...assigner },
    },
  ];
};

export const setPrimaryRoleInDraft = (
  baseRoles: UserRole[],
  roleId: number,
  assigner: DraftAssigner,
): UserRole[] => {
  const now = new Date().toISOString();

  return baseRoles.map((role) => ({
    ...role,
    isPrimary: role.id === roleId,
    ...(role.id === roleId
      ? {
          assignedAt: now,
          assignedBy: { ...assigner },
        }
      : {}),
  }));
};

export const removeRoleFromDraft = (
  baseRoles: UserRole[],
  roleId: number,
): UserRole[] => {
  const remainingRoles = baseRoles.filter((role) => role.id !== roleId);

  if (remainingRoles.length === 0) return remainingRoles;
  if (remainingRoles.some((role) => role.isPrimary)) return remainingRoles;

  return [
    { ...remainingRoles[0], isPrimary: true },
    ...remainingRoles.slice(1),
  ];
};

export const addOverrideToDraft = ({
  baseOverrides,
  permissions,
  permissionCode,
  nextOverrideId,
  assigner,
}: AddOverrideToDraftParams): AddOverrideToDraftResult => {
  if (
    baseOverrides.some((override) => override.permissionCode === permissionCode)
  ) {
    return {
      overrides: baseOverrides,
      nextOverrideId,
    };
  }

  const permission = permissions.find((item) => item.code === permissionCode);

  return {
    overrides: [
      ...baseOverrides,
      {
        id: nextOverrideId,
        permissionCode,
        permissionDescription: permission?.description ?? permissionCode,
        effect: "ALLOW",
        expiresAt: null,
        isExpired: false,
        assignedAt: new Date().toISOString(),
        assignedBy: { ...assigner },
      },
    ],
    nextOverrideId: nextOverrideId - 1,
  };
};

export const toggleOverrideEffectInDraft = (
  baseOverrides: UserOverride[],
  permissionCode: string,
): UserOverride[] => {
  return baseOverrides.map((override) =>
    override.permissionCode === permissionCode
      ? {
          ...override,
          effect: override.effect === "ALLOW" ? "DENY" : "ALLOW",
        }
      : override,
  );
};

export const setOverrideDateInDraft = (
  baseOverrides: UserOverride[],
  permissionCode: string,
  value: string,
): UserOverride[] => {
  return baseOverrides.map((override) =>
    override.permissionCode === permissionCode
      ? {
          ...override,
          expiresAt: value || null,
        }
      : override,
  );
};

export const removeOverrideFromDraft = (
  baseOverrides: UserOverride[],
  permissionCode: string,
): UserOverride[] => {
  return baseOverrides.filter(
    (override) => override.permissionCode !== permissionCode,
  );
};
