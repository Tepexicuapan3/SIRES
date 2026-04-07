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
    } as ReturnType<typeof usePermissions>);

    const { result } = renderHook(() => usePermissionDependencies());

    expect(
      result.current.hasCapability("legacy.catalogs.centers.export", {
        allOf: ["clinico:somatometria:read"],
      }),
    ).toBe(true);
  });
});
