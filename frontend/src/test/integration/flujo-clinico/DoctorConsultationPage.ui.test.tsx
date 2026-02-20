import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/utils";
import DoctorConsultationPage from "@features/flujo-clinico/pages/DoctorConsultationPage";
import { useStartConsultation } from "@features/flujo-clinico/mutations/useStartConsultation";
import { useDoctorQueue } from "@features/flujo-clinico/queries/useDoctorQueue";
import { useCloseVisit } from "@features/flujo-clinico/mutations/useCloseVisit";
import type { VisitQueueItem } from "@api/types";

vi.mock("@features/flujo-clinico/queries/useDoctorQueue", () => ({
  useDoctorQueue: vi.fn(),
}));

vi.mock("@features/flujo-clinico/mutations/useCloseVisit", () => ({
  useCloseVisit: vi.fn(),
}));

vi.mock("@features/flujo-clinico/mutations/useStartConsultation", () => ({
  useStartConsultation: vi.fn(),
}));

const createVisit = (
  overrides: Partial<VisitQueueItem> = {},
): VisitQueueItem => ({
  id: 1,
  folio: "VST-2001",
  patientId: 2001,
  arrivalType: "appointment",
  appointmentId: "APP-2001",
  doctorId: 77,
  notes: "Paciente listo para valoracion",
  status: "lista_para_doctor",
  ...overrides,
});

describe("DoctorConsultationPage UI", () => {
  const startMutateAsync = vi.fn();
  const closeMutateAsync = vi.fn();

  beforeEach(() => {
    startMutateAsync.mockReset();
    closeMutateAsync.mockReset();

    vi.mocked(useDoctorQueue).mockReturnValue({
      data: {
        items: [createVisit()],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useDoctorQueue>);

    vi.mocked(useStartConsultation).mockReturnValue({
      mutateAsync: startMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useStartConsultation>);

    vi.mocked(useCloseVisit).mockReturnValue({
      mutateAsync: closeMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCloseVisit>);

    startMutateAsync.mockResolvedValue({
      id: 1,
      folio: "VST-2001",
      patientId: 2001,
      arrivalType: "appointment",
      appointmentId: "APP-2001",
      doctorId: 77,
      notes: "Paciente listo para valoracion",
      status: "en_consulta",
    });

    closeMutateAsync.mockResolvedValue({
      visit: {
        id: 1,
        folio: "VST-2001",
        patientId: 2001,
        arrivalType: "appointment",
        appointmentId: "APP-2001",
        doctorId: 77,
        notes: "Paciente listo para valoracion",
        status: "cerrada",
      },
      consultation: {
        id: 900,
        visitId: 1,
        doctorId: 77,
        primaryDiagnosis: "Infeccion respiratoria",
        finalNote: "Paciente estable al egreso.",
        isActive: true,
        createdAt: "2026-02-20T12:00:00Z",
        updatedAt: "2026-02-20T12:10:00Z",
      },
    });
  });

  it("renderiza estado loading", () => {
    vi.mocked(useDoctorQueue).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useDoctorQueue>);

    render(<DoctorConsultationPage />);

    expect(screen.getByText("Cargando bandeja del doctor...")).toBeVisible();
  });

  it("renderiza estado empty", () => {
    vi.mocked(useDoctorQueue).mockReturnValue({
      data: { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useDoctorQueue>);

    render(<DoctorConsultationPage />);

    expect(
      screen.getByText("No hay pacientes listos para doctor."),
    ).toBeVisible();
  });

  it("renderiza estado error", () => {
    vi.mocked(useDoctorQueue).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("request failed"),
    } as unknown as ReturnType<typeof useDoctorQueue>);

    render(<DoctorConsultationPage />);

    expect(
      screen.getByText("No se pudo cargar la bandeja del doctor."),
    ).toBeVisible();
  });

  it("bloquea cierre hasta iniciar consulta y completar campos clinicos", async () => {
    const user = userEvent.setup();
    render(<DoctorConsultationPage />);

    const closeButton = screen.getByRole("button", { name: "Cerrar consulta" });
    expect(closeButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Iniciar consulta" }));
    await waitFor(() => {
      expect(startMutateAsync).toHaveBeenCalledWith({ visitId: 1 });
    });
    expect(closeButton).toBeDisabled();

    await user.type(
      screen.getByLabelText("Diagnostico principal"),
      "Infeccion respiratoria",
    );
    await user.type(
      screen.getByLabelText("Nota final"),
      "Paciente estable y con manejo ambulatorio.",
    );

    expect(closeButton).toBeEnabled();
  });

  it("cierra consulta cuando estado y formulario son validos", async () => {
    const user = userEvent.setup();
    render(<DoctorConsultationPage />);

    await user.click(screen.getByRole("button", { name: "Iniciar consulta" }));
    await waitFor(() => {
      expect(startMutateAsync).toHaveBeenCalledWith({ visitId: 1 });
    });
    await user.type(screen.getByLabelText("Diagnostico principal"), "Dx");
    await user.type(
      screen.getByLabelText("Nota final"),
      "Nota clinica de egreso",
    );

    await user.click(screen.getByRole("button", { name: "Cerrar consulta" }));

    await waitFor(() => {
      expect(closeMutateAsync).toHaveBeenCalledWith({
        visitId: 1,
        data: {
          primaryDiagnosis: "Dx",
          finalNote: "Nota clinica de egreso",
        },
      });
    });
  });
});
