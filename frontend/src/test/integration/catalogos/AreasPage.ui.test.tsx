import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent, {
  PointerEventsCheckLevel,
} from "@testing-library/user-event";
import { fireEvent, render, screen, waitFor, within } from "@/test/utils";
import AreasPage from "@features/admin/modules/catalogos/areas/pages/AreasPage";
import { toast } from "sonner";
import { usePermissions } from "@features/auth/queries/usePermissions";
import { useAreasList } from "@features/admin/modules/catalogos/areas/queries/useAreasList";
import { useUpdateArea } from "@features/admin/modules/catalogos/areas/mutations/useUpdateArea";
import { useDeleteArea } from "@features/admin/modules/catalogos/areas/mutations/useDeleteArea";
import type { AreaListItem } from "@api/types";

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
  "@features/admin/modules/catalogos/areas/components/AreaDetailsDialog",
  () => ({
    AreaDetailsDialog: ({ open }: { open: boolean }) =>
      open ? <div>Detalles area abierto</div> : null,
  }),
);

vi.mock(
  "@features/admin/modules/catalogos/areas/components/AreaCreateDialog",
  () => ({
    AreaCreateDialog: ({ open }: { open: boolean }) =>
      open ? <div>Crear area abierto</div> : null,
  }),
);

vi.mock("@features/auth/queries/usePermissions", () => ({
  usePermissions: vi.fn(),
}));

vi.mock("@features/admin/modules/catalogos/areas/queries/useAreasList", () => ({
  useAreasList: vi.fn(),
}));

vi.mock(
  "@features/admin/modules/catalogos/areas/mutations/useUpdateArea",
  () => ({
    useUpdateArea: vi.fn(),
  }),
);

vi.mock(
  "@features/admin/modules/catalogos/areas/mutations/useDeleteArea",
  () => ({
    useDeleteArea: vi.fn(),
  }),
);

const createArea = (overrides: Partial<AreaListItem> = {}): AreaListItem => ({
  id: 1,
  name: "Atencion Primaria",
  code: "ATP1",
  isActive: true,
  ...overrides,
});

describe("AreasPage UI", () => {
  const refetch = vi.fn();
  const updateMutate = vi.fn();
  const deleteMutate = vi.fn();

  beforeEach(() => {
    const firstArea = createArea({ id: 1, name: "Atencion Primaria" });
    const secondArea = createArea({
      id: 2,
      name: "Urgencias",
      code: "URG1",
      isActive: false,
    });

    vi.mocked(useAreasList).mockImplementation((params) => ({
      data: {
        items: [firstArea, secondArea],
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

    vi.mocked(useUpdateArea).mockReturnValue({
      mutateAsync: updateMutate,
      isPending: false,
    } as ReturnType<typeof useUpdateArea>);

    vi.mocked(useDeleteArea).mockReturnValue({
      mutateAsync: deleteMutate,
      isPending: false,
    } as ReturnType<typeof useDeleteArea>);

    updateMutate.mockResolvedValue({
      area: {
        id: 1,
        name: "Atencion Primaria",
        code: "ATP1",
        isActive: false,
      },
    });
    deleteMutate.mockResolvedValue({ success: true });
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("renders areas table with data", () => {
    render(<AreasPage />);

    expect(screen.getByRole("heading", { name: "Areas" })).toBeVisible();
    expect(screen.getByText("Atencion Primaria")).toBeVisible();
    expect(screen.getByText("Urgencias")).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Codigo" })).toBeVisible();
  });

  it("opens create dialog from primary action", async () => {
    const user = userEvent.setup();
    render(<AreasPage />);

    await user.click(screen.getByRole("button", { name: "Nuevo" }));

    expect(screen.getByText("Crear area abierto")).toBeVisible();
  });

  it("opens details dialog when clicking a row", async () => {
    const user = userEvent.setup();
    render(<AreasPage />);

    await user.click(screen.getByText("Atencion Primaria"));

    expect(screen.getByText("Detalles area abierto")).toBeVisible();
  });

  it("applies status filter and updates query params", async () => {
    const user = userEvent.setup();
    render(<AreasPage />);

    await user.click(screen.getByRole("button", { name: "Filtros" }));
    const menu = screen.getByRole("menu");
    await user.click(within(menu).getByText("Activas"));

    await waitFor(() => {
      expect(vi.mocked(useAreasList)).toHaveBeenLastCalledWith(
        expect.objectContaining({ isActive: true }),
      );
    });
  });

  it("executes status action from row menu", async () => {
    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    render(<AreasPage />);

    const row = screen.getByText("Atencion Primaria").closest("tr");
    expect(row).not.toBeNull();
    const actions = within(row as HTMLElement).getByLabelText("Acciones");

    fireEvent.pointerDown(actions);
    fireEvent.click(actions);
    await user.click(screen.getByRole("menuitem", { name: "Desactivar" }));

    await waitFor(() => {
      expect(updateMutate).toHaveBeenCalledWith({
        areaId: 1,
        data: { isActive: false },
      });
      expect(toast.success).toHaveBeenCalledWith("Area desactivada");
    });
  });

  it("executes delete action", async () => {
    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    render(<AreasPage />);

    const row = screen.getByText("Atencion Primaria").closest("tr");
    expect(row).not.toBeNull();
    const actions = within(row as HTMLElement).getByLabelText("Acciones");

    fireEvent.pointerDown(actions);
    fireEvent.click(actions);
    await user.click(screen.getByRole("menuitem", { name: "Eliminar" }));
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(deleteMutate).toHaveBeenCalledWith({ areaId: 1 });
      expect(toast.success).toHaveBeenCalledWith(
        "Area eliminada",
        expect.any(Object),
      );
    });
  });
});
