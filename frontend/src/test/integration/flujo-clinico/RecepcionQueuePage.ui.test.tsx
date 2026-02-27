import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, within, waitFor } from "@/test/utils";
import { ApiError } from "@api/utils/errors";
import RecepcionQueuePage from "@features/recepcion/modules/checkin/pages/RecepcionCheckinPage";
import { usePermissionDependencies } from "@features/auth/queries/usePermissionDependencies";
import { useRecepcionCheckinQueue } from "@features/recepcion/modules/checkin/queries/useRecepcionCheckinQueue";
import { useCreateVisit } from "@features/recepcion/modules/checkin/mutations/useCreateVisit";
import { useVisitStatusAction } from "@features/recepcion/modules/checkin/mutations/useVisitStatusAction";
import type { VisitQueueItem } from "@api/types";

vi.mock(
  "@features/recepcion/modules/checkin/queries/useRecepcionCheckinQueue",
  () => ({
    useRecepcionCheckinQueue: vi.fn(),
  }),
);

vi.mock("@features/recepcion/modules/checkin/mutations/useCreateVisit", () => ({
  useCreateVisit: vi.fn(),
}));

vi.mock(
  "@features/recepcion/modules/checkin/mutations/useVisitStatusAction",
  () => ({
    useVisitStatusAction: vi.fn(),
  }),
);

vi.mock("@features/auth/queries/usePermissionDependencies", () => ({
  usePermissionDependencies: vi.fn(),
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

describe("RecepcionQueuePage UI", () => {
  const createMutateAsync = vi.fn();
  const statusMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(usePermissionDependencies).mockReturnValue({
      hasCapability: () => true,
    } as unknown as ReturnType<typeof usePermissionDependencies>);

    vi.mocked(useRecepcionCheckinQueue).mockReturnValue({
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
    } as unknown as ReturnType<typeof useRecepcionCheckinQueue>);

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

  it("deshabilita carga de cola cuando no tiene permiso de lectura", () => {
    vi.mocked(usePermissionDependencies).mockReturnValue({
      hasCapability: () => false,
    } as unknown as ReturnType<typeof usePermissionDependencies>);

    vi.mocked(useRecepcionCheckinQueue).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useRecepcionCheckinQueue>);

    render(<RecepcionQueuePage />);

    expect(useRecepcionCheckinQueue).toHaveBeenCalledWith({ enabled: false });
    expect(
      screen.getByText(
        "No tenes permisos completos para cargar la bandeja de recepcion.",
      ),
    ).toBeVisible();
  });

  it("muestra aviso neutral y bloquea escrituras cuando no tiene permisos completos", () => {
    vi.mocked(usePermissionDependencies).mockReturnValue({
      hasCapability: (capability: string) =>
        capability === "flow.visits.queue.read",
    } as unknown as ReturnType<typeof usePermissionDependencies>);

    render(<RecepcionQueuePage />);

    expect(
      screen.getByText(
        "No tenes permisos completos para registrar llegadas o actualizar estados.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Registrar llegada" }),
    ).toBeDisabled();
    const firstRow = screen.getByText("VST-001").closest("tr");
    expect(firstRow).not.toBeNull();
    expect(
      within(firstRow as HTMLElement).getByRole("button", {
        name: "Cancelar visita",
      }),
    ).toBeDisabled();
  });

  it("renderiza estado loading", () => {
    vi.mocked(useRecepcionCheckinQueue).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useRecepcionCheckinQueue>);

    render(<RecepcionQueuePage />);

    expect(screen.getByText("Cargando cola de recepcion...")).toBeVisible();
  });

  it("renderiza estado empty", () => {
    vi.mocked(useRecepcionCheckinQueue).mockReturnValue({
      data: { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useRecepcionCheckinQueue>);

    render(<RecepcionQueuePage />);

    expect(screen.getByText("No hay pacientes en recepcion.")).toBeVisible();
  });

  it("renderiza estado error", () => {
    vi.mocked(useRecepcionCheckinQueue).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network error"),
    } as unknown as ReturnType<typeof useRecepcionCheckinQueue>);

    render(<RecepcionQueuePage />);

    expect(
      screen.getByText("No se pudo cargar la cola de recepcion."),
    ).toBeVisible();
  });

  it("renderiza la bandeja con visitas", () => {
    render(<RecepcionQueuePage />);

    expect(
      screen.getByRole("heading", { name: "Check-in y registro de llegada" }),
    ).toBeVisible();
    expect(screen.getByText("VST-001")).toBeVisible();
    expect(screen.getByText("VST-002")).toBeVisible();
  });

  it("aplica filtros y orden en la cola", async () => {
    vi.mocked(useRecepcionCheckinQueue).mockReturnValue({
      data: {
        items: [
          createVisit({
            id: 1,
            folio: "VST-001",
            patientId: 9001,
            arrivalType: "appointment",
            status: "en_espera",
          }),
          createVisit({
            id: 2,
            folio: "VST-010",
            patientId: 9010,
            arrivalType: "walk_in",
            appointmentId: null,
            status: "en_espera",
          }),
          createVisit({
            id: 3,
            folio: "VST-003",
            patientId: 9003,
            arrivalType: "appointment",
            status: "en_espera",
          }),
        ],
        page: 1,
        pageSize: 20,
        total: 3,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useRecepcionCheckinQueue>);

    const user = userEvent.setup();
    render(<RecepcionQueuePage />);

    await user.selectOptions(
      screen.getByLabelText("Ordenar por"),
      "patient_desc",
    );

    const table = screen.getByRole("table", { name: "Cola de recepcion" });
    const rows = within(table).getAllByRole("row");
    expect(within(rows[1] as HTMLElement).getByText("VST-010")).toBeVisible();

    await user.type(screen.getByLabelText("Buscar paciente o folio"), "9003");
    expect(screen.getByText("VST-003")).toBeVisible();
    expect(screen.queryByText("VST-001")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Buscar paciente o folio"));
    await user.selectOptions(
      screen.getByLabelText("Filtrar por tipo de llegada"),
      "walk_in",
    );

    expect(screen.getByText("VST-010")).toBeVisible();
    expect(screen.queryByText("VST-003")).not.toBeInTheDocument();
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
        serviceType: "medicina_general",
        appointmentId: "APP-1234",
        doctorId: undefined,
        notes: "Paciente sin acompanante",
      });
    });

    expect(screen.getByText("Llegada registrada correctamente.")).toBeVisible();
  });

  it("fuerza llegada sin cita para servicio de urgencias", async () => {
    const user = userEvent.setup();
    render(<RecepcionQueuePage />);

    await user.selectOptions(
      screen.getByLabelText("Servicio de atencion"),
      "urgencias",
    );

    expect(screen.queryByLabelText("ID de cita")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Tipo de llegada")).toBeDisabled();

    await user.type(screen.getByLabelText("ID paciente"), "2001");
    await user.type(screen.getByLabelText("Notas"), "Ingreso por dolor agudo");
    await user.click(screen.getByRole("button", { name: "Registrar llegada" }));

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith({
        patientId: 2001,
        arrivalType: "walk_in",
        serviceType: "urgencias",
        appointmentId: undefined,
        doctorId: undefined,
        notes: "Ingreso por dolor agudo",
      });
    });
  });

  it("mapea errores de dominio al registrar llegada", async () => {
    createMutateAsync.mockRejectedValueOnce(
      new ApiError(
        "VISIT_DUPLICATE_SUBMIT",
        "VISIT_DUPLICATE_SUBMIT",
        409,
        undefined,
        "req-test",
      ),
    );

    const user = userEvent.setup();
    render(<RecepcionQueuePage />);

    await user.type(screen.getByLabelText("ID paciente"), "1234");
    await user.type(screen.getByLabelText("ID de cita"), "APP-1234");
    await user.click(screen.getByRole("button", { name: "Registrar llegada" }));

    await waitFor(() => {
      expect(
        screen.getByText("Ya existe una visita abierta para este paciente."),
      ).toBeVisible();
    });
  });

  it("bloquea acciones invalidas segun estado de visita", () => {
    render(<RecepcionQueuePage />);

    const row = screen.getByText("VST-002").closest("tr");
    expect(row).not.toBeNull();

    expect(
      within(row as HTMLElement).getByRole("button", {
        name: "Cancelar visita",
      }),
    ).toBeDisabled();
    expect(
      within(row as HTMLElement).getByRole("button", {
        name: "Marcar no show",
      }),
    ).toBeDisabled();
  });

  it("confirma accion de cancelacion antes de mutar", async () => {
    const user = userEvent.setup();
    render(<RecepcionQueuePage />);

    const firstRow = screen.getByText("VST-001").closest("tr");
    expect(firstRow).not.toBeNull();

    await user.click(
      within(firstRow as HTMLElement).getByRole("button", {
        name: "Cancelar visita",
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar cancelacion" }),
    );

    await waitFor(() => {
      expect(statusMutateAsync).toHaveBeenCalledWith({
        visitId: 1,
        targetStatus: "cancelada",
      });
    });

    expect(screen.getByText("Visita marcada como cancelada.")).toBeVisible();
  });

  it("permite abortar la confirmacion de no show", async () => {
    const user = userEvent.setup();
    render(<RecepcionQueuePage />);

    const firstRow = screen.getByText("VST-001").closest("tr");
    expect(firstRow).not.toBeNull();

    await user.click(
      within(firstRow as HTMLElement).getByRole("button", {
        name: "Marcar no show",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Volver" }));

    expect(statusMutateAsync).not.toHaveBeenCalled();
  });

  it("mapea errores de dominio al actualizar estado", async () => {
    statusMutateAsync.mockRejectedValueOnce(
      new ApiError(
        "VISIT_STATE_INVALID",
        "VISIT_STATE_INVALID",
        409,
        undefined,
        "req-test",
      ),
    );

    const user = userEvent.setup();
    render(<RecepcionQueuePage />);

    const firstRow = screen.getByText("VST-001").closest("tr");
    expect(firstRow).not.toBeNull();

    await user.click(
      within(firstRow as HTMLElement).getByRole("button", {
        name: "Cancelar visita",
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar cancelacion" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "La visita ya no esta en un estado valido para esta accion. Actualiza la cola.",
        ),
      ).toBeVisible();
    });
  });
});
