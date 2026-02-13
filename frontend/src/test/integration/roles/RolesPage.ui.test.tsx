import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent, {
  PointerEventsCheckLevel,
} from "@testing-library/user-event";
import { fireEvent, render, screen, waitFor, within } from "@/test/utils";
import RolesPage from "@features/admin/modules/rbac/roles/pages/RolesPage";
import { createMockRoleListItem } from "@/test/factories/roles";
import { toast } from "sonner";
import { usePermissions } from "@features/auth/queries/usePermissions";
import { useRolesList } from "@features/admin/modules/rbac/roles/queries/useRolesList";
import { useDeleteRole } from "@features/admin/modules/rbac/roles/mutations/useDeleteRole";
import { ApiError } from "@/api/utils/errors";

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (value: string) => value,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock(
  "@features/admin/modules/rbac/roles/components/RoleDetailsDialog",
  () => ({
    RoleDetailsDialog: ({ open }: { open: boolean }) =>
      open ? <div>Detalles rol abierto</div> : null,
  }),
);

vi.mock(
  "@features/admin/modules/rbac/roles/components/RoleCreateDialog",
  () => ({
    RoleCreateDialog: ({ open }: { open: boolean }) =>
      open ? <div>Crear rol abierto</div> : null,
  }),
);

vi.mock("@features/auth/queries/usePermissions", () => ({
  usePermissions: vi.fn(),
}));

vi.mock("@features/admin/modules/rbac/roles/queries/useRolesList", () => ({
  useRolesList: vi.fn(),
}));

vi.mock("@features/admin/modules/rbac/roles/mutations/useDeleteRole", () => ({
  useDeleteRole: vi.fn(),
}));

describe("RolesPage UI", () => {
  const refetch = vi.fn();
  const deleteMutate = vi.fn();

  beforeEach(() => {
    const customRole = createMockRoleListItem({
      id: 1,
      name: "Auditoria",
      description: "Rol de auditoria",
      isSystem: false,
      isActive: true,
      usersCount: 0,
      permissionsCount: 12,
    });
    const systemRole = createMockRoleListItem({
      id: 2,
      name: "Admin",
      description: "Rol sistema",
      isSystem: true,
      isActive: true,
      usersCount: 5,
      permissionsCount: 30,
    });

    vi.mocked(useRolesList).mockImplementation((params) => ({
      data: {
        items: [customRole, systemRole],
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 10,
        total: 2,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
      refetch,
    }));

    vi.mocked(usePermissions).mockReturnValue({
      permissions: ["*"],
      hasPermission: () => true,
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
      isAdmin: () => true,
    });

    vi.mocked(useDeleteRole).mockReturnValue({
      mutateAsync: deleteMutate,
      isPending: false,
    } as ReturnType<typeof useDeleteRole>);

    deleteMutate.mockResolvedValue({ success: true });
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("renders roles table with data", () => {
    render(<RolesPage />);

    expect(screen.getByRole("heading", { name: "Roles" })).toBeVisible();
    expect(screen.getByText("Auditoria")).toBeVisible();
    expect(screen.getByText("Rol de auditoria")).toBeVisible();
    expect(
      screen.getByRole("columnheader", { name: "Permisos" }),
    ).toBeVisible();
  });

  it("shows explicit table error description", () => {
    vi.mocked(useRolesList).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError("ROLE_HAS_USERS", "Rol con usuarios", 400),
      refetch,
    } as ReturnType<typeof useRolesList>);

    render(<RolesPage />);

    expect(screen.getByText("No se pudo cargar roles")).toBeVisible();
    expect(
      screen.getByText(
        "No puedes eliminar un rol con usuarios activos asignados.",
      ),
    ).toBeVisible();
  });

  it("opens create dialog from primary action", async () => {
    const user = userEvent.setup();
    render(<RolesPage />);

    await user.click(screen.getByRole("button", { name: "Nuevo" }));

    expect(screen.getByText("Crear rol abierto")).toBeVisible();
  });

  it("opens details dialog when clicking a row", async () => {
    const user = userEvent.setup();
    render(<RolesPage />);

    await user.click(screen.getByText("Auditoria"));

    expect(screen.getByText("Detalles rol abierto")).toBeVisible();
  });

  it("applies type filter and updates query params", async () => {
    const user = userEvent.setup();
    render(<RolesPage />);

    await user.click(screen.getByRole("button", { name: "Filtros" }));
    const menu = screen.getByRole("menu");
    await user.click(within(menu).getByText("Sistema"));

    await waitFor(() => {
      expect(vi.mocked(useRolesList)).toHaveBeenLastCalledWith(
        expect.objectContaining({ isSystem: true }),
      );
    });
  });

  it("updates search query when typing", async () => {
    const user = userEvent.setup();
    render(<RolesPage />);

    await user.type(screen.getByPlaceholderText("Buscar en la tabla"), "aud");

    await waitFor(() => {
      expect(vi.mocked(useRolesList)).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "aud" }),
      );
    });
  });

  it("toggles column visibility", async () => {
    const user = userEvent.setup();
    render(<RolesPage />);

    await user.click(screen.getByRole("button", { name: "Columnas" }));
    await user.click(
      screen.getByRole("menuitemcheckbox", { name: "Descripción" }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("columnheader", { name: "Descripción" }),
      ).toBeNull();
    });
  });

  it("executes delete action", async () => {
    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    render(<RolesPage />);

    const row = screen.getByText("Auditoria").closest("tr");
    expect(row).not.toBeNull();
    const actions = within(row as HTMLElement).getByLabelText("Acciones");

    fireEvent.pointerDown(actions);
    fireEvent.click(actions);
    await user.click(screen.getByRole("menuitem", { name: "Eliminar" }));

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(deleteMutate).toHaveBeenCalledWith({ roleId: 1 });
      expect(toast.success).toHaveBeenCalledWith(
        "Rol eliminado",
        expect.any(Object),
      );
    });
  });

  it("disables delete when role has users", async () => {
    userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    render(<RolesPage />);

    const row = screen.getByText("Admin").closest("tr");
    expect(row).not.toBeNull();
    const actions = within(row as HTMLElement).getByLabelText("Acciones");

    fireEvent.pointerDown(actions);
    fireEvent.click(actions);
    const deleteItem = screen.getByRole("menuitem", { name: "Eliminar" });
    expect(deleteItem).toHaveAttribute("aria-disabled", "true");
  });
});
