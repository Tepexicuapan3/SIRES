import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@/test/utils";
import { UserDetailsDialog } from "@features/admin/modules/rbac/users/components/UserDetailsDialog";
import {
  createMockUser,
  createMockUserDetail,
  createMockUserRole,
} from "@/test/factories/users";
import { useUserDetail } from "@features/admin/modules/rbac/users/queries/useUserDetail";
import { usePermissionsCatalog } from "@features/admin/modules/rbac/permissions/queries/usePermissionsCatalog";
import { useUpdateUser } from "@features/admin/modules/rbac/users/mutations/useUpdateUser";
import { useActivateUser } from "@features/admin/modules/rbac/users/mutations/useActivateUser";
import { useDeactivateUser } from "@features/admin/modules/rbac/users/mutations/useDeactivateUser";
import { toast } from "sonner";
import type { CentroAtencionListItem, RoleListItem } from "@api/types";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@features/admin/modules/rbac/users/queries/useUserDetail", () => ({
  useUserDetail: vi.fn(),
}));

vi.mock(
  "@features/admin/modules/rbac/permissions/queries/usePermissionsCatalog",
  () => ({
    usePermissionsCatalog: vi.fn(),
  }),
);

vi.mock("@features/admin/modules/rbac/users/mutations/useUpdateUser", () => ({
  useUpdateUser: vi.fn(),
}));

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

describe("UserDetailsDialog UI", () => {
  const refetch = vi.fn();
  const updateMutate = vi.fn();
  const activateMutate = vi.fn();
  const deactivateMutate = vi.fn();
  const onOpenChange = vi.fn();
  const onClose = vi.fn();

  const roleOptions = [createRoleOption({ id: 1, name: "Admin" })];
  const clinicOptions = [createClinicOption({ id: 1, name: "Centro 1" })];

  const userSummary = createMockUser({
    id: 77,
    fullname: "Maria Lopez",
    username: "mlopez",
    email: "mlopez@metro.cdmx.gob.mx",
    isActive: true,
    clinic: { id: 1, name: "Centro 1" },
    primaryRole: "Admin",
  });

  beforeEach(() => {
    vi.mocked(usePermissionsCatalog).mockReturnValue({
      data: { items: [] },
      isLoading: false,
    } as ReturnType<typeof usePermissionsCatalog>);

    vi.mocked(useUpdateUser).mockReturnValue({
      mutateAsync: updateMutate,
      isPending: false,
    } as ReturnType<typeof useUpdateUser>);

    vi.mocked(useActivateUser).mockReturnValue({
      mutateAsync: activateMutate,
      isPending: false,
    } as ReturnType<typeof useActivateUser>);

    vi.mocked(useDeactivateUser).mockReturnValue({
      mutateAsync: deactivateMutate,
      isPending: false,
    } as ReturnType<typeof useDeactivateUser>);

    updateMutate.mockResolvedValue({
      user: createMockUserDetail({ id: 77, email: "mlopez@metro.cdmx.gob.mx" }),
    });
    activateMutate.mockResolvedValue({ id: 77, isActive: true });
    deactivateMutate.mockResolvedValue({ id: 77, isActive: false });
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    onOpenChange.mockClear();
    onClose.mockClear();
  });

  it("shows error state and retries", async () => {
    vi.mocked(useUserDetail).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as ReturnType<typeof useUserDetail>);

    const user = userEvent.setup();
    render(
      <UserDetailsDialog
        open
        onOpenChange={onOpenChange}
        onClose={onClose}
        userSummary={userSummary}
        roleOptions={roleOptions}
        clinicOptions={clinicOptions}
        canEdit
      />,
    );

    expect(screen.getByText("No se pudo cargar el usuario")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("saves updated fields", async () => {
    const userDetail = createMockUserDetail({
      id: 77,
      firstName: "Maria",
      paternalName: "Lopez",
      maternalName: "Diaz",
      email: "mlopez@metro.cdmx.gob.mx",
      clinic: { id: 1, name: "Centro 1" },
      primaryRole: "Admin",
      isActive: true,
    });

    vi.mocked(useUserDetail).mockReturnValue({
      data: {
        user: userDetail,
        roles: [createMockUserRole({ id: 1, name: "Admin", isPrimary: true })],
        overrides: [],
      },
      isLoading: false,
      isError: false,
      refetch,
    } as ReturnType<typeof useUserDetail>);

    const user = userEvent.setup();
    render(
      <UserDetailsDialog
        open
        onOpenChange={onOpenChange}
        onClose={onClose}
        userSummary={userSummary}
        roleOptions={roleOptions}
        clinicOptions={clinicOptions}
        canEdit
      />,
    );

    const emailInput = await screen.findByLabelText("Correo");
    await user.clear(emailInput);
    await user.type(emailInput, "nuevo@metro.cdmx.gob.mx");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(updateMutate).toHaveBeenCalledWith({
        userId: 77,
        data: { email: "nuevo@metro.cdmx.gob.mx" },
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Perfil actualizado",
        expect.any(Object),
      );
    });
  });

  it("updates user status from the general tab", async () => {
    const userDetail = createMockUserDetail({
      id: 77,
      firstName: "Maria",
      paternalName: "Lopez",
      maternalName: "Diaz",
      email: "mlopez@metro.cdmx.gob.mx",
      clinic: { id: 1, name: "Centro 1" },
      primaryRole: "Admin",
      isActive: true,
    });

    vi.mocked(useUserDetail).mockReturnValue({
      data: {
        user: userDetail,
        roles: [createMockUserRole({ id: 1, name: "Admin", isPrimary: true })],
        overrides: [],
      },
      isLoading: false,
      isError: false,
      refetch,
    } as ReturnType<typeof useUserDetail>);

    const user = userEvent.setup();
    render(
      <UserDetailsDialog
        open
        onOpenChange={onOpenChange}
        onClose={onClose}
        userSummary={userSummary}
        roleOptions={roleOptions}
        clinicOptions={clinicOptions}
        canEdit
      />,
    );

    const statusContainer = screen.getByText("Estado").closest("div");
    expect(statusContainer).not.toBeNull();
    const statusSelect = (statusContainer as HTMLElement).querySelector(
      "[data-slot='select-trigger']",
    );
    expect(statusSelect).not.toBeNull();
    await user.click(statusSelect as HTMLElement);
    const listbox = screen.getByRole("listbox");
    await user.click(within(listbox).getByText("Inactivo"));

    await waitFor(() => {
      expect(deactivateMutate).toHaveBeenCalledWith({ userId: 77 });
      expect(toast.success).toHaveBeenCalledWith("Usuario desactivado");
    });
  });

  it("renders read-only mode when user lacks update permission", async () => {
    vi.mocked(useUserDetail).mockReturnValue({
      data: {
        user: createMockUserDetail({ id: 77 }),
        roles: [createMockUserRole({ id: 1, name: "Admin", isPrimary: true })],
        overrides: [],
      },
      isLoading: false,
      isError: false,
      refetch,
    } as ReturnType<typeof useUserDetail>);

    render(
      <UserDetailsDialog
        open
        onOpenChange={onOpenChange}
        onClose={onClose}
        userSummary={userSummary}
        roleOptions={roleOptions}
        clinicOptions={clinicOptions}
        canEdit={false}
      />,
    );

    expect(
      screen.getByText(
        "Solo lectura: no tienes permisos para modificar este usuario.",
      ),
    ).toBeVisible();
    expect(screen.getByLabelText("Correo")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("shows explicit error when permissions catalog fails", async () => {
    const retryCatalog = vi.fn();

    vi.mocked(useUserDetail).mockReturnValue({
      data: {
        user: createMockUserDetail({ id: 77 }),
        roles: [createMockUserRole({ id: 1, name: "Admin", isPrimary: true })],
        overrides: [],
      },
      isLoading: false,
      isError: false,
      refetch,
    } as ReturnType<typeof useUserDetail>);

    vi.mocked(usePermissionsCatalog).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("forbidden"),
      refetch: retryCatalog,
    } as ReturnType<typeof usePermissionsCatalog>);

    const user = userEvent.setup();
    render(
      <UserDetailsDialog
        open
        onOpenChange={onOpenChange}
        onClose={onClose}
        userSummary={userSummary}
        roleOptions={roleOptions}
        clinicOptions={clinicOptions}
        canEdit
      />,
    );

    await user.click(screen.getByRole("tab", { name: /Permisos/i }));

    expect(
      screen.getByText(
        "No se pudo cargar el catalogo de permisos. Verifica que tengas admin:gestion:permisos:read.",
      ),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Reintentar catalogo" }),
    );
    expect(retryCatalog).toHaveBeenCalled();
  });

  it("closes the dialog from footer", async () => {
    vi.mocked(useUserDetail).mockReturnValue({
      data: {
        user: createMockUserDetail({ id: 77 }),
        roles: [],
        overrides: [],
      },
      isLoading: false,
      isError: false,
      refetch,
    } as ReturnType<typeof useUserDetail>);

    const user = userEvent.setup();
    render(
      <UserDetailsDialog
        open
        onOpenChange={onOpenChange}
        onClose={onClose}
        userSummary={userSummary}
        roleOptions={roleOptions}
        clinicOptions={clinicOptions}
        canEdit
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onClose).toHaveBeenCalled();
  });

  it("asks for confirmation when closing with unsaved changes", async () => {
    vi.mocked(useUserDetail).mockReturnValue({
      data: {
        user: createMockUserDetail({ id: 77 }),
        roles: [],
        overrides: [],
      },
      isLoading: false,
      isError: false,
      refetch,
    } as ReturnType<typeof useUserDetail>);

    const user = userEvent.setup();
    render(
      <UserDetailsDialog
        open
        onOpenChange={onOpenChange}
        onClose={onClose}
        userSummary={userSummary}
        roleOptions={roleOptions}
        clinicOptions={clinicOptions}
        canEdit
      />,
    );

    const emailInput = await screen.findByLabelText("Correo");
    await user.clear(emailInput);
    await user.type(emailInput, "dirty@metro.cdmx.gob.mx");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(
      screen.getByRole("heading", { name: "Salir sin guardar" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Salir sin guardar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onClose).toHaveBeenCalled();
  });
});
