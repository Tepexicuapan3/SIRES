import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@/test/utils";
import { RoleDetailsDialog } from "@features/admin/modules/rbac/roles/components/RoleDetailsDialog";
import {
  createMockRoleDetail,
  createMockRoleListItem,
  createMockRolePermission,
} from "@/test/factories/roles";
import { useRoleDetail } from "@features/admin/modules/rbac/roles/queries/useRoleDetail";
import { usePermissionsCatalog } from "@features/admin/modules/rbac/permissions/queries/usePermissionsCatalog";
import { useUpdateRole } from "@features/admin/modules/rbac/roles/mutations/useUpdateRole";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@features/admin/modules/rbac/roles/queries/useRoleDetail", () => ({
  useRoleDetail: vi.fn(),
}));

vi.mock(
  "@features/admin/modules/rbac/permissions/queries/usePermissionsCatalog",
  () => ({
    usePermissionsCatalog: vi.fn(),
  }),
);

vi.mock("@features/admin/modules/rbac/roles/mutations/useUpdateRole", () => ({
  useUpdateRole: vi.fn(),
}));

describe("RoleDetailsDialog UI", () => {
  const refetch = vi.fn();
  const updateMutate = vi.fn();
  const onOpenChange = vi.fn();
  const onClose = vi.fn();

  const roleSummary = createMockRoleListItem({
    id: 77,
    name: "Auditoria",
    description: "Rol auditoria",
    isActive: true,
    isSystem: false,
  });

  beforeEach(() => {
    vi.mocked(usePermissionsCatalog).mockReturnValue({
      data: { items: [] },
      isLoading: false,
    } as ReturnType<typeof usePermissionsCatalog>);

    vi.mocked(useUpdateRole).mockReturnValue({
      mutateAsync: updateMutate,
      isPending: false,
    } as ReturnType<typeof useUpdateRole>);

    updateMutate.mockResolvedValue({
      role: createMockRoleDetail({ id: 77, name: "Auditoria" }),
    });
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    onOpenChange.mockClear();
    onClose.mockClear();
  });

  it("shows error state and retries", async () => {
    vi.mocked(useRoleDetail).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as ReturnType<typeof useRoleDetail>);

    const user = userEvent.setup();
    render(
      <RoleDetailsDialog
        open
        onOpenChange={onOpenChange}
        onClose={onClose}
        roleSummary={roleSummary}
        canEdit
      />,
    );

    expect(screen.getByText("No se pudo cargar el rol")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("saves updated fields", async () => {
    const roleDetail = createMockRoleDetail({
      id: 77,
      name: "Auditoria",
      description: "Rol auditoria",
      landingRoute: "/admin/auditoria",
      isActive: true,
      isSystem: false,
    });

    vi.mocked(useRoleDetail).mockReturnValue({
      data: {
        role: roleDetail,
        permissions: [createMockRolePermission({ id: 1 })],
      },
      isLoading: false,
      isError: false,
      refetch,
    } as ReturnType<typeof useRoleDetail>);

    const user = userEvent.setup();
    render(
      <RoleDetailsDialog
        open
        onOpenChange={onOpenChange}
        onClose={onClose}
        roleSummary={roleSummary}
        canEdit
      />,
    );

    const nameInput = await screen.findByLabelText("Nombre del rol");
    await user.clear(nameInput);
    await user.type(nameInput, "Auditoria QA");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(updateMutate).toHaveBeenCalledWith({
        roleId: 77,
        data: { name: "Auditoria QA" },
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Rol actualizado",
        expect.any(Object),
      );
    });
  });

  it("updates role status from the general tab", async () => {
    const roleDetail = createMockRoleDetail({
      id: 77,
      name: "Auditoria",
      description: "Rol auditoria",
      isActive: true,
      isSystem: false,
    });

    vi.mocked(useRoleDetail).mockReturnValue({
      data: {
        role: roleDetail,
        permissions: [],
      },
      isLoading: false,
      isError: false,
      refetch,
    } as ReturnType<typeof useRoleDetail>);

    const user = userEvent.setup();
    render(
      <RoleDetailsDialog
        open
        onOpenChange={onOpenChange}
        onClose={onClose}
        roleSummary={roleSummary}
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
      expect(updateMutate).toHaveBeenCalledWith({
        roleId: 77,
        data: { isActive: false },
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Estado actualizado",
        expect.any(Object),
      );
    });
  });

  it("shows read-only notice for system role", async () => {
    const roleDetail = createMockRoleDetail({
      id: 77,
      name: "Admin",
      description: "Rol sistema",
      isActive: true,
      isSystem: true,
    });

    vi.mocked(useRoleDetail).mockReturnValue({
      data: {
        role: roleDetail,
        permissions: [],
      },
      isLoading: false,
      isError: false,
      refetch,
    } as ReturnType<typeof useRoleDetail>);

    render(
      <RoleDetailsDialog
        open
        onOpenChange={onOpenChange}
        onClose={onClose}
        roleSummary={roleSummary}
        canEdit
      />,
    );

    expect(
      screen.getByText(
        "Este rol es de sistema o no tienes permisos para modificarlo.",
      ),
    ).toBeVisible();
  });

  it("shows explicit error when permissions catalog fails", async () => {
    const retryCatalog = vi.fn();
    const roleDetail = createMockRoleDetail({
      id: 77,
      name: "Auditoria",
      isSystem: false,
    });

    vi.mocked(useRoleDetail).mockReturnValue({
      data: {
        role: roleDetail,
        permissions: [],
      },
      isLoading: false,
      isError: false,
      refetch,
    } as ReturnType<typeof useRoleDetail>);

    vi.mocked(usePermissionsCatalog).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("forbidden"),
      refetch: retryCatalog,
    } as ReturnType<typeof usePermissionsCatalog>);

    const user = userEvent.setup();
    render(
      <RoleDetailsDialog
        open
        onOpenChange={onOpenChange}
        onClose={onClose}
        roleSummary={roleSummary}
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

  it("asks for confirmation when closing with unsaved changes", async () => {
    const roleDetail = createMockRoleDetail({
      id: 77,
      name: "Auditoria",
      description: "Rol auditoria",
      isSystem: false,
    });

    vi.mocked(useRoleDetail).mockReturnValue({
      data: {
        role: roleDetail,
        permissions: [],
      },
      isLoading: false,
      isError: false,
      refetch,
    } as ReturnType<typeof useRoleDetail>);

    const user = userEvent.setup();
    render(
      <RoleDetailsDialog
        open
        onOpenChange={onOpenChange}
        onClose={onClose}
        roleSummary={roleSummary}
        canEdit
      />,
    );

    const nameInput = await screen.findByLabelText("Nombre del rol");
    await user.clear(nameInput);
    await user.type(nameInput, "Auditoria Editada");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(
      screen.getByRole("heading", { name: "Salir sin guardar" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Salir sin guardar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onClose).toHaveBeenCalled();
  });
});
