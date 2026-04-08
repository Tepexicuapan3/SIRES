import { describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import { usePermissions } from "@/domains/auth-access/hooks/usePermissions";

vi.mock("@/domains/auth-access/hooks/usePermissions", () => ({
  usePermissions: vi.fn(),
}));

describe("usePermissionDependencies capability source of truth", () => {
  it("denies by default when backend projection exists and capability is missing", () => {
    const usePermissionsMock = usePermissions as unknown as Mock;
    usePermissionsMock.mockReturnValue({
      permissions: ["clinico:somatometria:read"],
      effectivePermissions: ["clinico:somatometria:read"],
      capabilities: {},
      permissionDependenciesVersion: "v1",
      strictCapabilityPrefixes: ["flow.somatometria."],
      hasPermission: vi.fn(() => false),
      hasEffectivePermission: vi.fn(() => false),
      hasAnyPermission: vi.fn(() => false),
      hasAllPermissions: vi.fn(() => false),
      hasCapability: vi.fn(() => false),
      isAdmin: vi.fn(() => false),
    } as ReturnType<typeof usePermissions>);

    const { result } = renderHook(() => usePermissionDependencies());

    expect(
      result.current.hasCapability("flow.somatometria.capture", {
        allOf: ["clinico:somatometria:read"],
      }),
    ).toBe(false);
  });

  it("allows legacy fallback for non-migrated capabilities in transitional mode", () => {
    const usePermissionsMock = usePermissions as unknown as Mock;
    usePermissionsMock.mockReturnValue({
      permissions: ["clinico:somatometria:read"],
      effectivePermissions: ["clinico:somatometria:read"],
      capabilities: {},
      permissionDependenciesVersion: "v1",
      strictCapabilityPrefixes: ["flow.somatometria."],
      hasPermission: vi.fn(() => false),
      hasEffectivePermission: vi.fn(() => false),
      hasAnyPermission: vi.fn(() => false),
      hasAllPermissions: vi.fn(() => false),
      hasCapability: vi.fn(() => false),
      isAdmin: vi.fn(() => false),
    } as ReturnType<typeof usePermissions>);

    const { result } = renderHook(() => usePermissionDependencies());

    expect(
      result.current.hasCapability("legacy.catalogs.centers.export", {
        allOf: ["clinico:somatometria:read"],
      }),
    ).toBe(true);
  });

  it("denies admin capability by default when projection exists and capability is missing", () => {
    const usePermissionsMock = usePermissions as unknown as Mock;
    usePermissionsMock.mockReturnValue({
      permissions: ["admin:gestion:usuarios:read"],
      effectivePermissions: ["admin:gestion:usuarios:read"],
      capabilities: {},
      permissionDependenciesVersion: "v1",
      strictCapabilityPrefixes: [],
      hasPermission: vi.fn(() => false),
      hasEffectivePermission: vi.fn(() => false),
      hasAnyPermission: vi.fn(() => false),
      hasAllPermissions: vi.fn(() => false),
      hasCapability: vi.fn(() => false),
      isAdmin: vi.fn(() => false),
    } as ReturnType<typeof usePermissions>);

    const { result } = renderHook(() => usePermissionDependencies());

    expect(
      result.current.hasCapability("admin.users.read", {
        allOf: ["admin:gestion:usuarios:read"],
      }),
    ).toBe(false);
  });
});
