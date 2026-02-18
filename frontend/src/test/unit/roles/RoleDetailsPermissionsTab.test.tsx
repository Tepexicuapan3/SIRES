import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen } from "@/test/utils";
import { RoleDetailsPermissionsTab } from "@features/admin/modules/rbac/roles/components/RoleDetailsPermissionsTab";
import type { Permission, RolePermission } from "@api/types";

const createPermission = (overrides: Partial<Permission> = {}): Permission => ({
  id: 1,
  code: "admin:gestion:roles:update",
  description: "Gestionar roles",
  isSystem: true,
  ...overrides,
});

const createRolePermission = (
  overrides: Partial<RolePermission> = {},
): RolePermission => ({
  id: 1,
  code: "admin:gestion:roles:update",
  description: "Gestionar roles",
  assignedAt: "2024-01-01T00:00:00Z",
  assignedBy: { id: 1, name: "Admin" },
  ...overrides,
});

describe("RoleDetailsPermissionsTab", () => {
  const onAddPermission = vi.fn();
  const onRemovePermission = vi.fn();

  const catalog = [
    createPermission({ id: 1, code: "admin:gestion:roles:update" }),
    createPermission({ id: 2, code: "admin:gestion:roles:read" }),
  ];

  beforeEach(() => {
    onAddPermission.mockClear();
    onRemovePermission.mockClear();
  });

  it("calls add callback when adding a permission", async () => {
    const user = userEvent.setup();
    render(
      <RoleDetailsPermissionsTab
        permissions={[createRolePermission({ id: 1 })]}
        permissionCatalog={catalog}
        isLoadingPermissions={false}
        onAddPermission={onAddPermission}
        onRemovePermission={onRemovePermission}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Agregar permiso admin:gestion:roles:read",
      }),
    );

    expect(onAddPermission).toHaveBeenCalledWith(2);
  });

  it("shows catalog error and disables add action", () => {
    render(
      <RoleDetailsPermissionsTab
        permissions={[]}
        permissionCatalog={catalog}
        isLoadingPermissions={false}
        catalogErrorMessage="No se pudo cargar el catalogo"
        onAddPermission={onAddPermission}
        onRemovePermission={onRemovePermission}
      />,
    );

    expect(screen.getByText("No se pudo cargar el catalogo")).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "Agregar permiso admin:gestion:roles:update",
      }),
    ).toBeDisabled();
  });

  it("shows catalog access context and hides error banner", () => {
    render(
      <RoleDetailsPermissionsTab
        permissions={[]}
        permissionCatalog={catalog}
        isLoadingPermissions={false}
        catalogAccessMessage="No tienes acceso al catalogo de permisos."
        catalogErrorMessage="No se pudo cargar el catalogo"
        onAddPermission={onAddPermission}
        onRemovePermission={onRemovePermission}
      />,
    );

    expect(
      screen.getByText("No tienes acceso al catalogo de permisos."),
    ).toBeVisible();
    expect(screen.queryByText("No se pudo cargar el catalogo")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Reintentar catalogo" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", {
        name: "Agregar permiso admin:gestion:roles:update",
      }),
    ).toBeDisabled();
  });

  it("calls remove callback when removing a permission", async () => {
    render(
      <RoleDetailsPermissionsTab
        permissions={[createRolePermission()]}
        permissionCatalog={catalog}
        isLoadingPermissions={false}
        onAddPermission={onAddPermission}
        onRemovePermission={onRemovePermission}
      />,
    );

    const removeButton = screen.getByRole("button", {
      name: "Remover permiso admin:gestion:roles:update",
    });

    fireEvent.click(removeButton);

    expect(onRemovePermission).toHaveBeenCalledWith(1);
  });

  it("shows empty state when no permissions assigned", () => {
    render(
      <RoleDetailsPermissionsTab
        permissions={[]}
        permissionCatalog={catalog}
        isLoadingPermissions={false}
        onAddPermission={onAddPermission}
        onRemovePermission={onRemovePermission}
      />,
    );

    expect(
      screen.getByText("Este rol no tiene permisos asignados."),
    ).toBeVisible();
  });

  it("shows skeletons while loading", () => {
    const { container } = render(
      <RoleDetailsPermissionsTab
        permissions={[]}
        permissionCatalog={catalog}
        isLoadingPermissions
        onAddPermission={onAddPermission}
        onRemovePermission={onRemovePermission}
      />,
    );

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("renders permissions as read-only when editing is disabled", () => {
    render(
      <RoleDetailsPermissionsTab
        permissions={[createRolePermission()]}
        permissionCatalog={catalog}
        isLoadingPermissions={false}
        isEditable={false}
        onAddPermission={onAddPermission}
        onRemovePermission={onRemovePermission}
      />,
    );

    expect(
      screen.getByText(
        "Solo lectura: no puedes actualizar este rol porque no tienes permisos.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "Agregar permiso admin:gestion:roles:read",
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "Remover permiso admin:gestion:roles:update",
      }),
    ).toBeDisabled();
  });

  it("hides catalog error banner when tab is read-only", () => {
    render(
      <RoleDetailsPermissionsTab
        permissions={[createRolePermission()]}
        permissionCatalog={catalog}
        isLoadingPermissions={false}
        isEditable={false}
        catalogErrorMessage="No se pudo cargar el catalogo"
        onAddPermission={onAddPermission}
        onRemovePermission={onRemovePermission}
      />,
    );

    expect(screen.queryByText("No se pudo cargar el catalogo")).toBeNull();
    expect(
      screen.getByText(
        "Solo lectura: no puedes actualizar este rol porque no tienes permisos.",
      ),
    ).toBeVisible();
  });
});
