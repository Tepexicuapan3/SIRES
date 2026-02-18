import { usePermissions } from "@features/auth/queries/usePermissions";
import {
  evaluatePermissionDependencies,
  evaluatePermissionRequirement,
  type PermissionDependencyState,
  type PermissionRequirement,
  type PermissionRequirementState,
} from "@features/auth/domain/permission-dependencies";

export const usePermissionDependencies = () => {
  const permissionContext = usePermissions();
  const permissions = permissionContext.permissions ?? [];
  const effectivePermissions =
    permissionContext.effectivePermissions ?? permissions;
  const capabilities = permissionContext.capabilities ?? {};
  const permissionDependenciesVersion =
    permissionContext.permissionDependenciesVersion;
  const hasBackendProjection = Boolean(permissionDependenciesVersion);

  const getPermissionState = (
    permissionCode: string,
  ): PermissionDependencyState => {
    const localState = evaluatePermissionDependencies(
      permissionCode,
      permissions,
    );

    if (!hasBackendProjection) {
      return localState;
    }

    const grantedByBackend =
      effectivePermissions.includes("*") ||
      effectivePermissions.includes(permissionCode);

    return {
      ...localState,
      granted: grantedByBackend,
    };
  };

  const hasEffectivePermission = (permissionCode: string): boolean => {
    return getPermissionState(permissionCode).granted;
  };

  const getRequirementState = (
    requirement: PermissionRequirement,
  ): PermissionRequirementState => {
    const localState = evaluatePermissionRequirement(requirement, permissions);

    if (!hasBackendProjection) {
      return localState;
    }

    const backendState = evaluatePermissionRequirement(
      requirement,
      effectivePermissions,
    );

    return {
      ...localState,
      granted: backendState.granted,
    };
  };

  const hasEffectiveRequirement = (
    requirement: PermissionRequirement,
  ): boolean => {
    return getRequirementState(requirement).granted;
  };

  const hasCapability = (
    capabilityKey: string,
    fallbackRequirement?: PermissionRequirement,
  ): boolean => {
    const capabilityState = capabilities[capabilityKey];
    if (capabilityState) {
      return capabilityState.granted;
    }

    if (!fallbackRequirement) {
      return false;
    }

    return hasEffectiveRequirement(fallbackRequirement);
  };

  return {
    permissions,
    effectivePermissions,
    capabilities,
    permissionDependenciesVersion,
    getPermissionState,
    hasEffectivePermission,
    getRequirementState,
    hasEffectiveRequirement,
    hasCapability,
  };
};
