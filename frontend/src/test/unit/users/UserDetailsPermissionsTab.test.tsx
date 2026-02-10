import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen, waitFor } from "@/test/utils";
import { UserDetailsPermissionsTab } from "@features/admin/modules/rbac/users/components/UserDetailsPermissionsTab";
import { useAddUserOverride } from "@features/admin/modules/rbac/users/mutations/useAddUserOverride";
import { useRemoveUserOverride } from "@features/admin/modules/rbac/users/mutations/useRemoveUserOverride";
import { toast } from "sonner";
import type { Permission, UserOverride } from "@api/types";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock(
  "@features/admin/modules/rbac/users/mutations/useAddUserOverride",
  () => ({
    useAddUserOverride: vi.fn(),
  }),
);

vi.mock(
  "@features/admin/modules/rbac/users/mutations/useRemoveUserOverride",
  () => ({
    useRemoveUserOverride: vi.fn(),
  }),
);

const createPermission = (overrides: Partial<Permission> = {}): Permission => ({
  id: 1,
  code: "admin:gestion:usuarios:read",
  description: "Leer usuarios",
  isSystem: true,
  ...overrides,
});

const createOverride = (
  overrides: Partial<UserOverride> = {},
): UserOverride => ({
  id: 1,
  permissionCode: "admin:gestion:usuarios:read",
  permissionDescription: "Leer usuarios",
  effect: "ALLOW",
  expiresAt: null,
  isExpired: false,
  assignedAt: "2024-01-01T00:00:00Z",
  assignedBy: { id: 1, name: "Admin" },
  ...overrides,
});

describe("UserDetailsPermissionsTab", () => {
  const addOverrideMutate = vi.fn();
  const removeOverrideMutate = vi.fn();

  const permissions = [
    createPermission({ id: 1, code: "admin:gestion:usuarios:read" }),
    createPermission({ id: 2, code: "admin:gestion:usuarios:update" }),
  ];

  beforeEach(() => {
    vi.mocked(useAddUserOverride).mockReturnValue({
      mutateAsync: addOverrideMutate,
      isPending: false,
    } as ReturnType<typeof useAddUserOverride>);

    vi.mocked(useRemoveUserOverride).mockReturnValue({
      mutateAsync: removeOverrideMutate,
      isPending: false,
    } as ReturnType<typeof useRemoveUserOverride>);

    addOverrideMutate.mockResolvedValue({ userId: 10, overrides: [] });
    removeOverrideMutate.mockResolvedValue({ userId: 10, overrides: [] });
    addOverrideMutate.mockClear();
    removeOverrideMutate.mockClear();
    vi.mocked(toast.success).mockClear();
  });

  it("adds a new override", async () => {
    const user = userEvent.setup();
    render(
      <UserDetailsPermissionsTab
        userId={10}
        overrides={[]}
        permissions={permissions}
        isLoadingPermissions={false}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Agregar override admin:gestion:usuarios:update",
      }),
    );

    expect(addOverrideMutate).toHaveBeenCalledWith({
      userId: 10,
      data: {
        permissionCode: "admin:gestion:usuarios:update",
        effect: "ALLOW",
      },
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Override agregado",
      expect.any(Object),
    );
  });

  it("toggles and updates override", async () => {
    const user = userEvent.setup();
    render(
      <UserDetailsPermissionsTab
        userId={10}
        overrides={[createOverride()]}
        permissions={permissions}
        isLoadingPermissions={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cambiar a DENY" }));

    expect(addOverrideMutate).toHaveBeenCalledWith({
      userId: 10,
      data: {
        permissionCode: "admin:gestion:usuarios:read",
        effect: "DENY",
        expiresAt: undefined,
      },
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Override actualizado",
      expect.any(Object),
    );
  });

  it("updates override expiration date", async () => {
    const user = userEvent.setup();
    const override = createOverride({
      effect: "ALLOW",
      expiresAt: "2024-01-10T00:00:00Z",
    });

    const { container } = render(
      <UserDetailsPermissionsTab
        userId={10}
        overrides={[override]}
        permissions={permissions}
        isLoadingPermissions={false}
      />,
    );

    const dateInput = container.querySelector("input[type='date']");
    expect(dateInput).not.toBeNull();

    await user.clear(dateInput as HTMLInputElement);
    await user.type(dateInput as HTMLInputElement, "2024-02-01");
    await user.tab();

    await waitFor(() => {
      expect(addOverrideMutate).toHaveBeenCalledWith({
        userId: 10,
        data: {
          permissionCode: "admin:gestion:usuarios:read",
          effect: "ALLOW",
          expiresAt: "2024-02-01",
        },
      });
    });
  });

  it("removes an override", async () => {
    render(
      <UserDetailsPermissionsTab
        userId={10}
        overrides={[createOverride()]}
        permissions={permissions}
        isLoadingPermissions={false}
      />,
    );

    const removeButton = screen.getByRole("button", {
      name: "Eliminar override admin:gestion:usuarios:read",
    });

    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(removeOverrideMutate).toHaveBeenCalledWith({
        userId: 10,
        permissionCode: "admin:gestion:usuarios:read",
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Override eliminado",
        expect.any(Object),
      );
    });
  });

  it("shows catalog error and disables add", () => {
    render(
      <UserDetailsPermissionsTab
        userId={10}
        overrides={[]}
        permissions={permissions}
        isLoadingPermissions={false}
        catalogErrorMessage="No se pudo cargar el catalogo"
      />,
    );

    expect(screen.getByText("No se pudo cargar el catalogo")).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "Agregar override admin:gestion:usuarios:read",
      }),
    ).toBeDisabled();
  });

  it("renders overrides as read-only when editing is disabled", () => {
    render(
      <UserDetailsPermissionsTab
        userId={10}
        overrides={[createOverride()]}
        permissions={permissions}
        isLoadingPermissions={false}
        isEditable={false}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Agregar override admin:gestion:usuarios:update",
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Cambiar a DENY" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "Eliminar override admin:gestion:usuarios:read",
      }),
    ).toBeDisabled();
  });
});
