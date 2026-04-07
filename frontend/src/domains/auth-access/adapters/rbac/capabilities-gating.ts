import type { PermissionRequirement } from "@/domains/auth-access/types/permission-dependencies";

interface CapabilityResolverOptions {
  hasCapability: (
    capabilityKey: string,
    fallbackRequirement?: PermissionRequirement,
  ) => boolean;
  isCapabilitiesLoading: boolean;
  isCapabilitiesError: boolean;
}

export const RBAC_CAPABILITIES_DEGRADED_MESSAGE = {
  users:
    "Se deshabilitaron acciones de usuarios de forma segura. Reintenta para refrescar capacidades.",
  roles:
    "Se deshabilitaron acciones de roles de forma segura. Reintenta para refrescar capacidades.",
} as const;

export const createCapabilityResolver = ({
  hasCapability,
  isCapabilitiesLoading,
  isCapabilitiesError,
}: CapabilityResolverOptions) => {
  const hasResolvedCapabilities =
    !isCapabilitiesLoading && !isCapabilitiesError;

  const resolveCapability = (
    capabilityKey: string,
    fallbackRequirement?: PermissionRequirement,
  ) => {
    if (!hasResolvedCapabilities) {
      return false;
    }

    return hasCapability(capabilityKey, fallbackRequirement);
  };

  return {
    hasResolvedCapabilities,
    resolveCapability,
  };
};
