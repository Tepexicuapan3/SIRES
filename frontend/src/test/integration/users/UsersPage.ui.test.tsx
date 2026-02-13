import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent, {
  PointerEventsCheckLevel,
} from "@testing-library/user-event";
import { fireEvent, render, screen, waitFor, within } from "@/test/utils";
import UsersPage from "@features/admin/modules/rbac/users/pages/UsersPage";
import { createMockUser } from "@/test/factories/users";
import { toast } from "sonner";
import { usePermissions } from "@features/auth/queries/usePermissions";
import { useUsersList } from "@features/admin/modules/rbac/users/queries/useUsersList";
import { useRolesList } from "@features/admin/modules/rbac/roles/queries/useRolesList";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import { useActivateUser } from "@features/admin/modules/rbac/users/mutations/useActivateUser";
import { useDeactivateUser } from "@features/admin/modules/rbac/users/mutations/useDeactivateUser";
import type { CentroAtencionListItem, RoleListItem } from "@api/types";
import { ApiError } from "@/api/utils/errors";

const userDetailsDialogPropsSpy = vi.fn();

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
  "@features/admin/modules/rbac/users/components/UserDetailsDialog",
  () => ({
    UserDetailsDialog: ({
      open,
      canEdit,
    }: {
      open: boolean;
      canEdit?: boolean;
    }) => {
      userDetailsDialogPropsSpy({ open, canEdit });
      return open ? <div>Detalles abiertos</div> : null;
    },
  }),
);

vi.mock(
  "@features/admin/modules/rbac/users/components/UserCreateDialog",
  () => ({
    UserCreateDialog: ({ open }: { open: boolean }) =>
      open ? <div>Crear abierto</div> : null,
  }),
);

vi.mock("@features/auth/queries/usePermissions", () => ({
  usePermissions: vi.fn(),
}));

vi.mock("@features/admin/modules/rbac/users/queries/useUsersList", () => ({
  useUsersList: vi.fn(),
}));

vi.mock("@features/admin/modules/rbac/roles/queries/useRolesList", () => ({
  useRolesList: vi.fn(),
}));

vi.mock(
  "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList",
  () => ({
    useCentrosAtencionList: vi.fn(),
  }),
);

vi.mock("@features/admin/modules/rbac/users/mutations/useActivateUser", () => ({
  useActivateUser: vi.fn(),
}));

vi.mock(
  "@features/admin/modules/rbac/users/mutations/useDeactivateUser",
  () => ({
    useDeactivateUser: vi.fn(),
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

const createClinicOption = (
  overrides: Partial<CentroAtencionListItem> = {},
): CentroAtencionListItem => ({
  id: 1,
  name: "Centro 1",
  folioCode: "CEN-001",
  isExternal: false,
  isActive: true,
  ...overrides,
});

describe("UsersPage UI", () => {
  const refetch = vi.fn();
  const activateMutate = vi.fn();
  const deactivateMutate = vi.fn();

  beforeEach(() => {
    const activeUser = createMockUser({
      id: 1,
      fullname: "Juan Perez",
      username: "jperez",
      email: "juan.perez@metro.cdmx.gob.mx",
      isActive: true,
      clinic: { id: 1, name: "Centro 1" },
      primaryRole: "Clinico",
      avatarUrl: null,
    });

    const inactiveUser = createMockUser({
      id: 2,
      fullname: "Roberto Bloqueado",
      username: "banned_user",
      email: "banned@metro.cdmx.gob.mx",
      isActive: false,
      clinic: null,
      primaryRole: "Auditoria",
      avatarUrl: null,
    });

    vi.mocked(useUsersList).mockImplementation((params) => ({
      data: {
        items: [activeUser, inactiveUser],
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 10,
        total: 2,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
      refetch,
    }));

    vi.mocked(useRolesList).mockReturnValue({
      data: {
        items: [
          createRoleOption({ id: 1, name: "Clinico" }),
          createRoleOption({ id: 2, name: "Auditoria" }),
        ],
      },
    } as ReturnType<typeof useRolesList>);

    vi.mocked(useCentrosAtencionList).mockReturnValue({
      data: {
        items: [createClinicOption({ id: 1, name: "Centro 1" })],
      },
    } as ReturnType<typeof useCentrosAtencionList>);

    vi.mocked(usePermissions).mockReturnValue({
      permissions: ["*"],
      hasPermission: () => true,
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
      isAdmin: () => true,
    });

    vi.mocked(useActivateUser).mockReturnValue({
      mutateAsync: activateMutate,
      isPending: false,
    } as ReturnType<typeof useActivateUser>);

    vi.mocked(useDeactivateUser).mockReturnValue({
      mutateAsync: deactivateMutate,
      isPending: false,
    } as ReturnType<typeof useDeactivateUser>);

    activateMutate.mockResolvedValue({ id: 2, isActive: true });
    deactivateMutate.mockResolvedValue({ id: 1, isActive: false });
    vi.mocked(toast.success).mockClear();
    userDetailsDialogPropsSpy.mockClear();
  });

  it("renders users table with data", () => {
    render(<UsersPage />);

    expect(screen.getByRole("heading", { name: "Usuarios" })).toBeVisible();
    expect(screen.getByText("Juan Perez")).toBeVisible();
    expect(screen.getByText("jperez")).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Correo" })).toBeVisible();
  });

  it("shows explicit table error description", () => {
    vi.mocked(useUsersList).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError("USER_NOT_FOUND", "Usuario no encontrado", 404),
      refetch,
    } as ReturnType<typeof useUsersList>);

    render(<UsersPage />);

    expect(screen.getByText("No se pudo cargar usuarios")).toBeVisible();
    expect(
      screen.getByText("El usuario ya no existe o fue eliminado."),
    ).toBeVisible();
  });

  it("opens create dialog from primary action", async () => {
    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    render(<UsersPage />);

    await user.click(screen.getByRole("button", { name: "Nuevo" }));

    expect(screen.getByText("Crear abierto")).toBeVisible();
  });

  it("opens details dialog when clicking a row", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await user.click(screen.getByText("Juan Perez"));

    expect(screen.getByText("Detalles abiertos")).toBeVisible();
  });

  it("applies status filter and updates query params", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await user.click(screen.getByRole("button", { name: "Filtros" }));
    await user.click(screen.getByText("Inactivos"));

    await waitFor(() => {
      expect(vi.mocked(useUsersList)).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: "inactive" }),
      );
    });
  });

  it("applies pending status filter and updates query params", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await user.click(screen.getByRole("button", { name: "Filtros" }));
    await user.click(screen.getByText("Pendientes"));

    await waitFor(() => {
      expect(vi.mocked(useUsersList)).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: "pending" }),
      );
    });
  });

  it("updates search query when typing", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await user.type(screen.getByPlaceholderText("Buscar en la tabla"), "juan");

    await waitFor(() => {
      expect(vi.mocked(useUsersList)).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "juan" }),
      );
    });
  });

  it("toggles column visibility", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await user.click(screen.getByRole("button", { name: "Columnas" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Correo" }));

    await waitFor(() => {
      expect(screen.queryByRole("columnheader", { name: "Correo" })).toBeNull();
    });
  });

  it("executes activate/deactivate actions", async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    const activeRow = screen.getByText("Juan Perez").closest("tr");
    expect(activeRow).not.toBeNull();
    const activeActions = within(activeRow as HTMLElement).getByLabelText(
      "Acciones",
    );

    fireEvent.pointerDown(activeActions);
    fireEvent.click(activeActions);
    await user.click(screen.getByRole("menuitem", { name: "Desactivar" }));

    await waitFor(() => {
      expect(deactivateMutate).toHaveBeenCalledWith({ userId: 1 });
      expect(toast.success).toHaveBeenCalledWith("Usuario desactivado");
    });

    const inactiveRow = screen.getByText("Roberto Bloqueado").closest("tr");
    expect(inactiveRow).not.toBeNull();
    const inactiveActions = within(inactiveRow as HTMLElement).getByLabelText(
      "Acciones",
    );

    fireEvent.pointerDown(inactiveActions);
    fireEvent.click(inactiveActions);
    await user.click(screen.getByRole("menuitem", { name: "Activar" }));

    await waitFor(() => {
      expect(activateMutate).toHaveBeenCalledWith({ userId: 2 });
      expect(toast.success).toHaveBeenCalledWith("Usuario activado");
    });
  });

  it("opens details in read-only when update permission is missing", async () => {
    const user = userEvent.setup();

    vi.mocked(usePermissions).mockReturnValue({
      permissions: ["admin:gestion:usuarios:read"],
      hasPermission: (permission) =>
        permission === "admin:gestion:usuarios:read",
      hasAnyPermission: () => true,
      hasAllPermissions: () => false,
      isAdmin: () => false,
    });

    render(<UsersPage />);

    await user.click(screen.getByText("Juan Perez"));

    expect(userDetailsDialogPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ open: true, canEdit: false }),
    );
  });
});
