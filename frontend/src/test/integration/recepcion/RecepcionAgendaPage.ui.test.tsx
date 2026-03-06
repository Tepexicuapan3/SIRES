import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { render, screen, within } from "@/test/utils";
import RecepcionAgendaPage from "@features/recepcion/modules/agenda/pages/RecepcionAgendaPage";
import { usePermissionDependencies } from "@features/auth/queries/usePermissionDependencies";
import { useRecepcionAgendaQueue } from "@features/recepcion/modules/agenda/queries/useRecepcionAgendaQueue";
import { useVisitStatusAction } from "@features/recepcion/modules/checkin/mutations/useVisitStatusAction";
import type { VisitQueueItem } from "@api/types";

vi.mock("@features/auth/queries/usePermissionDependencies", () => ({
  usePermissionDependencies: vi.fn(),
}));

vi.mock(
  "@features/recepcion/modules/agenda/queries/useRecepcionAgendaQueue",
  () => ({
    useRecepcionAgendaQueue: vi.fn(),
  }),
);

vi.mock(
  "@features/recepcion/modules/checkin/mutations/useVisitStatusAction",
  () => ({
    useVisitStatusAction: vi.fn(),
  }),
);

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createVisit = (
  overrides: Partial<VisitQueueItem> = {},
): VisitQueueItem => ({
  id: 1,
  folio: "VST-001",
  patientId: 1001,
  arrivalType: "appointment",
  serviceType: "medicina_general",
  appointmentId: "APP-1001",
  doctorId: 12,
  notes: "Paciente puntual",
  status: "en_espera",
  ...overrides,
});

describe("RecepcionAgendaPage UI", () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(usePermissionDependencies).mockReturnValue({
      hasCapability: () => true,
    } as unknown as ReturnType<typeof usePermissionDependencies>);

    vi.mocked(useRecepcionAgendaQueue).mockReturnValue({
      data: {
        items: [
          createVisit({ id: 1, folio: "VST-001" }),
          createVisit({
            id: 2,
            folio: "VST-002",
            serviceType: "especialidad",
          }),
          createVisit({
            id: 3,
            folio: "VST-003",
            arrivalType: "walk_in",
            serviceType: "urgencias",
            appointmentId: null,
          }),
        ],
        page: 1,
        pageSize: 50,
        total: 3,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
      connectionStatus: "connected",
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useRecepcionAgendaQueue>);

    vi.mocked(useVisitStatusAction).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useVisitStatusAction>);

    mutateAsync.mockResolvedValue({ id: 1, status: "en_somatometria" });
  });

  it("deshabilita carga de agenda cuando no tiene permiso de lectura", () => {
    vi.mocked(usePermissionDependencies).mockReturnValue({
      hasCapability: () => false,
    } as unknown as ReturnType<typeof usePermissionDependencies>);

    vi.mocked(useRecepcionAgendaQueue).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      connectionStatus: "idle",
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useRecepcionAgendaQueue>);

    render(<RecepcionAgendaPage />);

    expect(useRecepcionAgendaQueue).toHaveBeenCalledWith({ enabled: false });
    expect(
      screen.getByText(
        "No tenes permisos completos para cargar la agenda operativa de recepcion.",
      ),
    ).toBeVisible();
  });

  it("renderiza panel operativo, filtros y CTA principal de ficha", async () => {
    const user = userEvent.setup();
    render(<RecepcionAgendaPage />);

    expect(
      screen.getByRole("heading", { name: "Citas y check-in operativo" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Generar ficha de consulta" }),
    ).toBeVisible();

    await user.selectOptions(screen.getByLabelText("Servicio"), "urgencias");

    expect(screen.getByText("VST-003")).toBeVisible();
    expect(screen.queryByText("VST-001")).not.toBeInTheDocument();
  });

  it("prioriza urgencias y luego con cita dentro de visitas abiertas", () => {
    render(<RecepcionAgendaPage />);

    const folios = screen
      .getAllByText(/^VST-00[1-3]$/)
      .map((folioElement) => folioElement.textContent);

    expect(folios).toEqual(["VST-003", "VST-001", "VST-002"]);
  });

  it("muestra accion No llego solo para visitas con cita", () => {
    render(<RecepcionAgendaPage />);

    const walkInCard = screen.getByText("VST-003").closest("article");
    const appointmentCard = screen.getByText("VST-001").closest("article");

    expect(walkInCard).not.toBeNull();
    expect(appointmentCard).not.toBeNull();

    expect(
      within(walkInCard as HTMLElement).queryByRole("button", {
        name: "No llego",
      }),
    ).not.toBeInTheDocument();
    expect(
      within(appointmentCard as HTMLElement).getByRole("button", {
        name: "No llego",
      }),
    ).toBeVisible();
  });

  it("ejecuta accion Llego desde una tarjeta con toast", async () => {
    const user = userEvent.setup();
    render(<RecepcionAgendaPage />);

    const visitCard = screen.getByText("VST-001").closest("article");

    expect(visitCard).not.toBeNull();

    await user.click(
      within(visitCard as HTMLElement).getByRole("button", { name: "Llego" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Enviar a somatometria" }),
    );

    expect(mutateAsync).toHaveBeenCalledWith({
      visitId: 1,
      targetStatus: "en_somatometria",
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Paciente enviado a somatometria.",
    );
  });
});
