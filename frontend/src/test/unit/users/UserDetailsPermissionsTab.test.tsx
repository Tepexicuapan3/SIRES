import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen, within } from "@/test/utils";
import { UserDetailsPermissionsTab } from "@/domains/auth-access/components/admin/rbac/users/UserDetailsPermissionsTab";
import type { Permission, UserOverride } from "@api/types";

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
  const onAddOverride = vi.fn();
  const onToggleOverride = vi.fn();
  const onOverrideDateChange = vi.fn();
  const onRemoveOverride = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const permissions = [
    createPermission({ id: 1, code: "admin:gestion:usuarios:read" }),
    createPermission({ id: 2, code: "admin:gestion:usuarios:update" }),
  ];

  type UserDetailsPermissionsTabProps = Parameters<
    typeof UserDetailsPermissionsTab
  >[0];

  const renderComponent = (
    props: Partial<UserDetailsPermissionsTabProps> = {},
  ) => {
    return render(
      <UserDetailsPermissionsTab
        overrides={[]}
        permissions={permissions}
        isLoadingPermissions={false}
        onAddOverride={onAddOverride}
        onToggleOverride={onToggleOverride}
        onOverrideDateChange={onOverrideDateChange}
        onRemoveOverride={onRemoveOverride}
        {...props}
      />,
    );
  };

  it("stages a new override", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.type(
      screen.getByRole("textbox", { name: /buscar permiso para override/i }),
      "actualizar usuarios",
    );
    await user.click(
      screen.getByRole("option", {
        name: "Agregar override admin:gestion:usuarios:update",
      }),
    );

    expect(onAddOverride).toHaveBeenCalledWith("admin:gestion:usuarios:update");
  });

  it("adds first ranked permission on Enter", async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByRole("textbox", {
      name: /buscar permiso para override/i,
    });

    await user.type(input, "actualizar usuarios");
    await user.keyboard("{Enter}");

    expect(onAddOverride).toHaveBeenCalledWith("admin:gestion:usuarios:update");
  });

  it("navigates results with keyboard arrows", async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByRole("textbox", {
      name: /buscar permiso para override/i,
    });

    await user.type(input, "usuarios");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(onAddOverride).toHaveBeenCalledWith("admin:gestion:usuarios:update");
  });

  it("stages override toggle", async () => {
    const user = userEvent.setup();
    renderComponent({ overrides: [createOverride()] });

    await user.click(
      screen.getByRole("switch", {
        name: "Cambiar efecto de admin:gestion:usuarios:read",
      }),
    );

    expect(onToggleOverride).toHaveBeenCalledWith(
      "admin:gestion:usuarios:read",
    );
  });

  it("stages override expiration date change", async () => {
    const user = userEvent.setup();
    renderComponent({ overrides: [createOverride({ expiresAt: null })] });

    await user.click(
      screen.getByRole("button", {
        name: /fecha de expiracion admin:gestion:usuarios:read/i,
      }),
    );

    const calendar = screen.getByRole("grid");
    const enabledDayButtons = within(calendar)
      .getAllByRole("button")
      .filter(
        (button) =>
          !button.hasAttribute("disabled") &&
          button.getAttribute("aria-label") !== null,
      );

    expect(enabledDayButtons.length).toBeGreaterThan(0);

    fireEvent.click(enabledDayButtons[0] as HTMLButtonElement);

    expect(onOverrideDateChange).toHaveBeenCalledWith(
      "admin:gestion:usuarios:read",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
  });

  it("clears override expiration date", async () => {
    const user = userEvent.setup();
    renderComponent({
      overrides: [createOverride({ expiresAt: "2026-02-20" })],
    });

    await user.click(
      screen.getByRole("button", {
        name: /quitar fecha de expiracion admin:gestion:usuarios:read/i,
      }),
    );

    expect(onOverrideDateChange).toHaveBeenCalledWith(
      "admin:gestion:usuarios:read",
      "",
    );
  });

  it("stages override removal", () => {
    renderComponent({ overrides: [createOverride()] });

    const removeButton = screen.getByRole("button", {
      name: "Eliminar override admin:gestion:usuarios:read",
    });

    fireEvent.click(removeButton);

    expect(onRemoveOverride).toHaveBeenCalledWith(
      "admin:gestion:usuarios:read",
    );
  });

  it("shows catalog error and disables add", () => {
    renderComponent({ catalogErrorMessage: "No se pudo cargar el catalogo" });

    expect(screen.getByText("No se pudo cargar el catalogo")).toBeVisible();
    expect(
      screen.getByRole("textbox", {
        name: /buscar permiso para override/i,
      }),
    ).toBeDisabled();
  });

  it("shows catalog access context and hides error banner", () => {
    renderComponent({
      catalogAccessMessage: "No tienes acceso al catalogo de permisos.",
      catalogErrorMessage: "No se pudo cargar el catalogo",
    });

    expect(
      screen.getByText("No tienes acceso al catalogo de permisos."),
    ).toBeVisible();
    expect(screen.queryByText("No se pudo cargar el catalogo")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Reintentar catalogo" }),
    ).toBeNull();
    expect(
      screen.getByRole("textbox", {
        name: /buscar permiso para override/i,
      }),
    ).toBeDisabled();
  });

  it("renders overrides as read-only when editing is disabled", () => {
    renderComponent({ overrides: [createOverride()], isEditable: false });

    expect(
      screen.getByText(
        "Solo lectura: no puedes actualizar este usuario porque no tienes permisos.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("textbox", {
        name: /buscar permiso para override/i,
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("switch", {
        name: "Cambiar efecto de admin:gestion:usuarios:read",
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "Eliminar override admin:gestion:usuarios:read",
      }),
    ).toBeDisabled();
  });

  it("hides catalog error banner when tab is read-only", () => {
    renderComponent({
      overrides: [createOverride()],
      isEditable: false,
      catalogErrorMessage: "No se pudo cargar el catalogo",
    });

    expect(screen.queryByText("No se pudo cargar el catalogo")).toBeNull();
    expect(
      screen.getByText(
        "Solo lectura: no puedes actualizar este usuario porque no tienes permisos.",
      ),
    ).toBeVisible();
  });
});
