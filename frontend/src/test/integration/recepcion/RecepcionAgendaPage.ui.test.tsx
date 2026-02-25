import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/utils";
import RecepcionAgendaPage from "@features/recepcion/modules/agenda/pages/RecepcionAgendaPage";
import { usePermissionDependencies } from "@features/auth/queries/usePermissionDependencies";
import { useRecepcionAgendaQueue } from "@features/recepcion/modules/agenda/queries/useRecepcionAgendaQueue";
import { useCreateVisit } from "@features/flujo-clinico/mutations/useCreateVisit";
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

vi.mock("@features/flujo-clinico/mutations/useCreateVisit", () => ({
  useCreateVisit: vi.fn(),
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
  const createMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(usePermissionDependencies).mockReturnValue({
      hasCapability: () => true,
    } as unknown as ReturnType<typeof usePermissionDependencies>);

    vi.mocked(useRecepcionAgendaQueue).mockReturnValue({
      data: {
        items: [
          createVisit({
            id: 1,
            folio: "VST-001",
            notes: "Paciente puntual",
          }),
          createVisit({
            id: 2,
            folio: "VST-002",
            serviceType: "especialidad",
            notes: "Seguimiento cardiologia",
          }),
          createVisit({
            id: 3,
            folio: "VST-003",
            arrivalType: "walk_in",
            serviceType: "urgencias",
            appointmentId: null,
            notes: "Dolor toracico agudo",
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

    vi.mocked(useCreateVisit).mockReturnValue({
      mutateAsync: createMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateVisit>);

    createMutateAsync.mockResolvedValue({ id: 99 });
  });

  it("deshabilita carga de agenda cuando no tiene permiso de lectura", () => {
    vi.mocked(usePermissionDependencies).mockReturnValue({
      hasCapability: (capability: string) =>
        capability === "flow.recepcion.queue.write",
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

  it("renderiza metricas y filtros por servicio", async () => {
    const user = userEvent.setup();
    render(<RecepcionAgendaPage />);

    expect(
      screen.getByRole("heading", { name: "Agenda operativa" }),
    ).toBeVisible();
    expect(
      screen.getByRole("option", { name: "Medicina general" }),
    ).toBeVisible();
    expect(screen.getByRole("option", { name: "Especialidad" })).toBeVisible();
    expect(screen.getByRole("option", { name: "Urgencias" })).toBeVisible();

    await user.selectOptions(screen.getByLabelText("Servicio"), "urgencias");

    expect(screen.getByText("VST-003")).toBeVisible();
    expect(screen.queryByText("VST-001")).not.toBeInTheDocument();
  });

  it("registra llegada rapida desde agenda", async () => {
    const user = userEvent.setup();
    render(<RecepcionAgendaPage />);

    await user.click(screen.getByRole("button", { name: "Check-in rapido" }));
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

  it("fuerza walk-in para urgencias en check-in rapido", async () => {
    const user = userEvent.setup();
    render(<RecepcionAgendaPage />);

    await user.click(screen.getByRole("button", { name: "Check-in rapido" }));
    await user.selectOptions(
      screen.getByLabelText("Servicio de atencion"),
      "urgencias",
    );
    await user.type(screen.getByLabelText("ID paciente"), "4321");
    await user.type(
      screen.getByLabelText("Notas"),
      "Ingreso directo por trauma",
    );
    await user.click(screen.getByRole("button", { name: "Registrar llegada" }));

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith({
        patientId: 4321,
        arrivalType: "walk_in",
        serviceType: "urgencias",
        appointmentId: undefined,
        doctorId: undefined,
        notes: "Ingreso directo por trauma",
      });
    });
  });
});
