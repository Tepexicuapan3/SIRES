import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen, within } from "@/test/utils";
import { UserDetailsRolesTab } from "@features/admin/modules/rbac/users/components/UserDetailsRolesTab";
import { createMockUserRole } from "@/test/factories/users";
import type { RoleListItem } from "@api/types";

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
  const onAddRole = vi.fn();
  const onSetPrimaryRole = vi.fn();
  const onRemoveRole = vi.fn();

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
    onAddRole.mockClear();
    onSetPrimaryRole.mockClear();
    onRemoveRole.mockClear();
  });

  it("stages a new role", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <UserDetailsRolesTab
        roles={roles}
        roleOptions={roleOptions}
        onAddRole={onAddRole}
        onSetPrimaryRole={onSetPrimaryRole}
        onRemoveRole={onRemoveRole}
      />,
    );

    const selectTriggers = container.querySelectorAll(
      "[data-slot='select-trigger']",
    );
    expect(selectTriggers.length).toBeGreaterThan(1);
    await user.click(selectTriggers[1] as HTMLElement);
    await user.click(screen.getByText("Auditoria"));

    expect(onAddRole).toHaveBeenCalledWith(3);
  });

  it("stages primary role change", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <UserDetailsRolesTab
        roles={roles}
        roleOptions={roleOptions}
        onAddRole={onAddRole}
        onSetPrimaryRole={onSetPrimaryRole}
        onRemoveRole={onRemoveRole}
      />,
    );

    const selectTriggers = container.querySelectorAll(
      "[data-slot='select-trigger']",
    );
    expect(selectTriggers.length).toBeGreaterThan(0);
    await user.click(selectTriggers[0] as HTMLElement);
    const listbox = screen.getByRole("listbox");
    await user.click(within(listbox).getByText("Clinico"));

    expect(onSetPrimaryRole).toHaveBeenCalledWith(2);
  });

  it("stages secondary role removal", async () => {
    render(
      <UserDetailsRolesTab
        roles={roles}
        roleOptions={roleOptions}
        onAddRole={onAddRole}
        onSetPrimaryRole={onSetPrimaryRole}
        onRemoveRole={onRemoveRole}
      />,
    );

    const removeButton = screen.getByRole("button", {
      name: "Remover rol Clinico",
    });

    fireEvent.click(removeButton);

    expect(onRemoveRole).toHaveBeenCalledWith(2);
  });

  it("disables role management in read-only mode", () => {
    const { container } = render(
      <UserDetailsRolesTab
        roles={roles}
        roleOptions={roleOptions}
        isEditable={false}
        onAddRole={onAddRole}
        onSetPrimaryRole={onSetPrimaryRole}
        onRemoveRole={onRemoveRole}
      />,
    );

    const selectTriggers = container.querySelectorAll(
      "[data-slot='select-trigger']",
    );

    expect(selectTriggers.length).toBeGreaterThan(1);
    expect(selectTriggers[0]).toHaveAttribute("data-disabled");
    expect(selectTriggers[1]).toHaveAttribute("data-disabled");
    expect(
      screen.getByRole("button", { name: "Remover rol Clinico" }),
    ).toBeDisabled();
  });
});
