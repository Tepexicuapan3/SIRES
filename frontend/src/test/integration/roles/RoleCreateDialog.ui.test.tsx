import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/utils";
import { RoleCreateDialog } from "@/domains/auth-access/components/admin/rbac/roles/RoleCreateDialog";
import { useCreateRole } from "@/domains/auth-access/hooks/rbac/roles/useCreateRole";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/domains/auth-access/hooks/rbac/roles/useCreateRole", () => ({
  useCreateRole: vi.fn(),
}));

describe("RoleCreateDialog UI", () => {
  const onOpenChange = vi.fn();
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.mocked(useCreateRole).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as ReturnType<typeof useCreateRole>);
    onOpenChange.mockReset();
    mutateAsync.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("shows validation errors on empty submit", async () => {
    const user = userEvent.setup();
    render(<RoleCreateDialog open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: "Crear rol" }));

    expect(await screen.findByText("Nombre requerido")).toBeVisible();
    expect(await screen.findByText("Descripcion requerida")).toBeVisible();
  });

  it("submits and shows created summary", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({ id: 45, name: "AUDITORIA" });

    render(<RoleCreateDialog open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText("Nombre del rol"), "AUDITORIA");
    await user.type(screen.getByLabelText("Descripcion"), "Rol auditoria");
    await user.type(screen.getByLabelText("Landing route"), "/admin/auditoria");

    await user.click(screen.getByRole("button", { name: "Crear rol" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        data: {
          name: "AUDITORIA",
          description: "Rol auditoria",
          landingRoute: "/admin/auditoria",
        },
      });
    });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Rol creado",
      expect.objectContaining({
        description: expect.stringContaining("AUDITORIA"),
      }),
    );
  });

  it("shows error toast when creation fails", async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValueOnce(new Error("boom"));

    render(<RoleCreateDialog open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText("Nombre del rol"), "AUDITORIA");
    await user.type(screen.getByLabelText("Descripcion"), "Rol auditoria");
    await user.click(screen.getByRole("button", { name: "Crear rol" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "No se pudo crear el rol",
        expect.any(Object),
      );
    });
  });
});
