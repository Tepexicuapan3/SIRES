import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent, {
  PointerEventsCheckLevel,
} from "@testing-library/user-event";
import { fireEvent, render, screen, waitFor, within } from "@/test/utils";
import RolesPage from "@/domains/auth-access/pages/admin/roles/RolesPage";
import { createMockRoleListItem } from "@/test/factories/roles";
import { toast } from "sonner";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import { useAuthCapabilities } from "@/domains/auth-access/hooks/useAuthCapabilities";
import { useRolesList } from "@/domains/auth-access/hooks/rbac/roles/useRolesList";
import { useDeleteRole } from "@/domains/auth-access/hooks/rbac/roles/useDeleteRole";
import { ApiError } from "@api/utils/errors";

const roleDetailsDialogPropsSpy = vi.fn();

vi.mock("@shared/hooks/useDebounce", () => ({
  useDebounce: (value: string) => value,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock(
  "@/domains/auth-access/components/admin/rbac/roles/RoleDetailsDialog",
  () => ({
    RoleDetailsDialog: ({
      open,
      canReadPermissionsCatalog,
    }: {
      open: boolean;
      canReadPermissionsCatalog?: boolean;
    }) => {
      roleDetailsDialogPropsSpy({ open, canReadPermissionsCatalog });
      return open ? <div>Detalles rol abierto</div> : null;
    },
  }),
);

vi.mock(
  "@/domains/auth-access/components/admin/rbac/roles/RoleCreateDialog",
  () => ({
    RoleCreateDialog: ({ open }: { open: boolean }) =>
      open ? <div>Crear rol abierto</div> : null,
  }),
);

vi.mock("@/domains/auth-access/hooks/usePermissionDependencies", () => ({
  usePermissionDependencies: vi.fn(),
}));

vi.mock("@/domains/auth-access/hooks/useAuthCapabilities", () => ({
  useAuthCapabilities: vi.fn(),
}));

vi.mock("@/domains/auth-access/hooks/rbac/roles/useRolesList", () => ({
  useRolesList: vi.fn(),
}));

vi.mock("@/domains/auth-access/hooks/rbac/roles/useDeleteRole", () => ({
  useDeleteRole: vi.fn(),
}));

describe("RolesPage UI", () => {
  const refetch = vi.fn();
  const refetchCapabilities = vi.fn();
  const deleteMutate = vi.fn();
  const defaultPermissionDeps = {
    hasCapability: () => true,
    hasPermission: () => true,
    hasEffectivePermission: () => true,
  } as ReturnType<typeof usePermissionDependencies>;

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

    vi.mocked(usePermissionDependencies).mockReturnValue(defaultPermissionDeps);

    vi.mocked(useAuthCapabilities).mockReturnValue({
      isLoading: false,
      isError: false,
      refetch: refetchCapabilities,
    } as ReturnType<typeof useAuthCapabilities>);

    vi.mocked(useDeleteRole).mockReturnValue({
      mutateAsync: deleteMutate,
      isPending: false,
    } as ReturnType<typeof useDeleteRole>);

    deleteMutate.mockResolvedValue({ success: true });
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    roleDetailsDialogPropsSpy.mockClear();
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
        expect.any(Object),
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
        expect.any(Object),
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

  it("passes permissions catalog access flag to details dialog", async () => {
    const user = userEvent.setup();

    vi.mocked(usePermissionDependencies).mockReturnValue({
      ...defaultPermissionDeps,
      hasCapability: (capabilityKey) =>
        capabilityKey === "admin.roles.read" ||
        capabilityKey === "admin.roles.update",
    } as ReturnType<typeof usePermissionDependencies>);

    render(<RolesPage />);

    await user.click(screen.getByText("Auditoria"));

    expect(roleDetailsDialogPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        open: true,
        canReadPermissionsCatalog: false,
      }),
    );
  });

  it("disables roles query when read capability is denied", () => {
    vi.mocked(usePermissionDependencies).mockReturnValue({
      ...defaultPermissionDeps,
      hasCapability: () => false,
      hasPermission: () => false,
      hasEffectivePermission: () => false,
    } as ReturnType<typeof usePermissionDependencies>);

    render(<RolesPage />);

    expect(vi.mocked(useRolesList)).toHaveBeenLastCalledWith(
      expect.any(Object),
      expect.objectContaining({ enabled: false }),
    );
  });

  it("keeps privileged role actions disabled while capabilities are loading", () => {
    vi.mocked(useAuthCapabilities).mockReturnValue({
      isLoading: true,
      isError: false,
      refetch: refetchCapabilities,
    } as ReturnType<typeof useAuthCapabilities>);

    render(<RolesPage />);

    expect(screen.queryByRole("button", { name: "Nuevo" })).toBeNull();
    expect(vi.mocked(useRolesList)).toHaveBeenLastCalledWith(
      expect.any(Object),
      expect.objectContaining({ enabled: false }),
    );
  });

  it("shows degraded-safe message and fail-closed behavior on capabilities error", () => {
    vi.mocked(useAuthCapabilities).mockReturnValue({
      isLoading: false,
      isError: true,
      refetch: refetchCapabilities,
    } as ReturnType<typeof useAuthCapabilities>);

    render(<RolesPage />);

    expect(screen.getByText("No se pudo validar permisos")).toBeVisible();
    expect(
      screen.getByText(
        "Se deshabilitaron acciones de roles de forma segura. Reintenta para refrescar capacidades.",
      ),
    ).toBeVisible();
    expect(vi.mocked(useRolesList)).toHaveBeenLastCalledWith(
      expect.any(Object),
      expect.objectContaining({ enabled: false }),
    );
  });
});
