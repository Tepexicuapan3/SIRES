import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, within, waitFor } from "@/test/utils";
import RecepcionQueuePage from "@features/flujo-clinico/pages/RecepcionQueuePage";
import { useRecepcionQueue } from "@features/flujo-clinico/queries/useRecepcionQueue";
import { useCreateVisit } from "@features/flujo-clinico/mutations/useCreateVisit";
import { useVisitStatusAction } from "@features/flujo-clinico/mutations/useVisitStatusAction";
import type { VisitQueueItem } from "@api/types";

vi.mock("@features/flujo-clinico/queries/useRecepcionQueue", () => ({
  useRecepcionQueue: vi.fn(),
}));

vi.mock("@features/flujo-clinico/mutations/useCreateVisit", () => ({
  useCreateVisit: vi.fn(),
}));

vi.mock("@features/flujo-clinico/mutations/useVisitStatusAction", () => ({
  useVisitStatusAction: vi.fn(),
}));

const createVisit = (
  overrides: Partial<VisitQueueItem> = {},
): VisitQueueItem => ({
  id: 1,
  folio: "VST-001",
  patientId: 1001,
  arrivalType: "appointment",
  appointmentId: "APP-1001",
  doctorId: 12,
  notes: "Paciente puntual",
  status: "en_espera",
  ...overrides,
});

describe("RecepcionQueuePage UI", () => {
  const createMutateAsync = vi.fn();
  const statusMutateAsync = vi.fn();

  beforeEach(() => {
    vi.mocked(useRecepcionQueue).mockReturnValue({
      data: {
        items: [
          createVisit({ id: 1, folio: "VST-001", status: "en_espera" }),
          createVisit({ id: 2, folio: "VST-002", status: "en_somatometria" }),
        ],
        page: 1,
        pageSize: 20,
        total: 2,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useRecepcionQueue>);

    vi.mocked(useCreateVisit).mockReturnValue({
      mutateAsync: createMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateVisit>);

    vi.mocked(useVisitStatusAction).mockReturnValue({
      mutateAsync: statusMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useVisitStatusAction>);

    createMutateAsync.mockResolvedValue({ id: 99 });
    statusMutateAsync.mockResolvedValue({ id: 1, status: "cancelada" });
  });

  it("renderiza estado loading", () => {
    vi.mocked(useRecepcionQueue).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useRecepcionQueue>);

    render(<RecepcionQueuePage />);

    expect(screen.getByText("Cargando cola de recepcion...")).toBeVisible();
  });

  it("renderiza estado empty", () => {
    vi.mocked(useRecepcionQueue).mockReturnValue({
      data: { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useRecepcionQueue>);

    render(<RecepcionQueuePage />);

    expect(screen.getByText("No hay pacientes en recepcion.")).toBeVisible();
  });

  it("renderiza estado error", () => {
    vi.mocked(useRecepcionQueue).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network error"),
    } as unknown as ReturnType<typeof useRecepcionQueue>);

    render(<RecepcionQueuePage />);

    expect(
      screen.getByText("No se pudo cargar la cola de recepcion."),
    ).toBeVisible();
  });

  it("renderiza la bandeja con visitas", () => {
    render(<RecepcionQueuePage />);

    expect(
      screen.getByRole("heading", { name: "Bandeja de recepcion" }),
    ).toBeVisible();
    expect(screen.getByText("VST-001")).toBeVisible();
    expect(screen.getByText("VST-002")).toBeVisible();
  });

  it("valida formulario critico de llegada", async () => {
    const user = userEvent.setup();
    render(<RecepcionQueuePage />);

    await user.click(screen.getByRole("button", { name: "Registrar llegada" }));

    expect(screen.getByText("Ingresa un ID de paciente valido.")).toBeVisible();
    expect(
      screen.getByText(
        "appointmentId es obligatorio para arrivalType=appointment.",
      ),
    ).toBeVisible();
    expect(createMutateAsync).not.toHaveBeenCalled();
  });

  it("permite registrar llegada cuando formulario es valido", async () => {
    const user = userEvent.setup();
    render(<RecepcionQueuePage />);

    await user.type(screen.getByLabelText("ID paciente"), "1234");
    await user.type(screen.getByLabelText("ID de cita"), "APP-1234");
    await user.type(screen.getByLabelText("Notas"), "Paciente sin acompanante");

    await user.click(screen.getByRole("button", { name: "Registrar llegada" }));

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith({
        patientId: 1234,
        arrivalType: "appointment",
        appointmentId: "APP-1234",
        doctorId: undefined,
        notes: "Paciente sin acompanante",
      });
    });
  });

  it("bloquea acciones invalidas segun estado de visita", () => {
    render(<RecepcionQueuePage />);

    const row = screen.getByText("VST-002").closest("tr");
    expect(row).not.toBeNull();

    expect(
      within(row as HTMLElement).getByRole("button", { name: "Cancelar" }),
    ).toBeDisabled();
    expect(
      within(row as HTMLElement).getByRole("button", {
        name: "Marcar no show",
      }),
    ).toBeDisabled();
  });
});
