import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen, waitFor, within } from "@/test/utils";
import { UserDetailsRolesTab } from "@features/admin/modules/rbac/users/components/UserDetailsRolesTab";
import { createMockUserRole } from "@/test/factories/users";
import { useAssignRoles } from "@features/admin/modules/rbac/users/mutations/useAssignRoles";
import { useRevokeUserRole } from "@features/admin/modules/rbac/users/mutations/useRevokeUserRole";
import { useSetPrimaryRole } from "@features/admin/modules/rbac/users/mutations/useSetPrimaryRole";
import { toast } from "sonner";
import type { RoleListItem } from "@api/types";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@features/admin/modules/rbac/users/mutations/useAssignRoles", () => ({
  useAssignRoles: vi.fn(),
}));

vi.mock(
  "@features/admin/modules/rbac/users/mutations/useRevokeUserRole",
  () => ({
    useRevokeUserRole: vi.fn(),
  }),
);

vi.mock(
  "@features/admin/modules/rbac/users/mutations/useSetPrimaryRole",
  () => ({
    useSetPrimaryRole: vi.fn(),
  }),
);

const createRoleOption = (
  overrides: Partial<RoleListItem> = {},
): RoleListItem => ({
  id: 1,
  name: "Admin",
  description: "Rol admin",
  isActive: true,
  isSystem: false,
  landingRoute: "/admin/panel",
  permissionsCount: 5,
  usersCount: 3,
  ...overrides,
});

describe("UserDetailsRolesTab", () => {
  const assignMutate = vi.fn();
  const setPrimaryMutate = vi.fn();
  const revokeMutate = vi.fn();

  const roles = [
    createMockUserRole({ id: 1, name: "Admin", isPrimary: true }),
    createMockUserRole({ id: 2, name: "Clinico", isPrimary: false }),
  ];

  const roleOptions = [
    createRoleOption({ id: 1, name: "Admin" }),
    createRoleOption({ id: 2, name: "Clinico" }),
    createRoleOption({ id: 3, name: "Auditoria" }),
  ];

  beforeEach(() => {
    vi.mocked(useAssignRoles).mockReturnValue({
      mutateAsync: assignMutate,
      isPending: false,
    } as ReturnType<typeof useAssignRoles>);

    vi.mocked(useSetPrimaryRole).mockReturnValue({
      mutateAsync: setPrimaryMutate,
      isPending: false,
    } as ReturnType<typeof useSetPrimaryRole>);

    vi.mocked(useRevokeUserRole).mockReturnValue({
      mutateAsync: revokeMutate,
      isPending: false,
    } as ReturnType<typeof useRevokeUserRole>);

    assignMutate.mockResolvedValue({ userId: 10, roles: [] });
    setPrimaryMutate.mockResolvedValue({ userId: 10, roles: [] });
    revokeMutate.mockResolvedValue({ userId: 10, roles: [] });
    assignMutate.mockClear();
    setPrimaryMutate.mockClear();
    revokeMutate.mockClear();
    vi.mocked(toast.success).mockClear();
  });

  it("assigns a new role", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <UserDetailsRolesTab
        userId={10}
        roles={roles}
        roleOptions={roleOptions}
      />,
    );

    const selectTriggers = container.querySelectorAll(
      "[data-slot='select-trigger']",
    );
    expect(selectTriggers.length).toBeGreaterThan(1);
    await user.click(selectTriggers[1] as HTMLElement);
    await user.click(screen.getByText("Auditoria"));
    await user.click(screen.getByRole("button", { name: "Agregar" }));

    expect(assignMutate).toHaveBeenCalledWith({
      userId: 10,
      data: { roleIds: [3] },
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Rol agregado",
      expect.any(Object),
    );
  });

  it("updates the primary role", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <UserDetailsRolesTab
        userId={10}
        roles={roles}
        roleOptions={roleOptions}
      />,
    );

    const selectTriggers = container.querySelectorAll(
      "[data-slot='select-trigger']",
    );
    expect(selectTriggers.length).toBeGreaterThan(0);
    await user.click(selectTriggers[0] as HTMLElement);
    const listbox = screen.getByRole("listbox");
    await user.click(within(listbox).getByText("Clinico"));

    expect(setPrimaryMutate).toHaveBeenCalledWith({
      userId: 10,
      data: { roleId: 2 },
    });
    expect(toast.success).toHaveBeenCalledWith("Rol principal actualizado");
  });

  it("removes a secondary role", async () => {
    render(
      <UserDetailsRolesTab
        userId={10}
        roles={roles}
        roleOptions={roleOptions}
      />,
    );

    const removeButton = screen.getByRole("button", {
      name: "Remover rol Clinico",
    });

    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(revokeMutate).toHaveBeenCalledWith({ userId: 10, roleId: 2 });
      expect(toast.success).toHaveBeenCalledWith("Rol removido");
    });
  });

  it("disables role management in read-only mode", () => {
    const { container } = render(
      <UserDetailsRolesTab
        userId={10}
        roles={roles}
        roleOptions={roleOptions}
        isEditable={false}
      />,
    );

    const selectTriggers = container.querySelectorAll(
      "[data-slot='select-trigger']",
    );

    expect(selectTriggers.length).toBeGreaterThan(0);
    expect(selectTriggers[0]).toHaveAttribute("data-disabled");
    expect(screen.getByRole("button", { name: "Agregar" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Remover rol Clinico" }),
    ).toBeDisabled();
  });
});
