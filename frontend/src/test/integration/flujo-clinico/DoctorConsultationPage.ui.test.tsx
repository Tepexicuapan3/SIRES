import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/utils";
import { ApiError } from "@api/utils/errors";
import DoctorConsultationPage from "@features/consulta-medica/modules/atencion/pages/DoctorConsultationPage";
import { usePermissionDependencies } from "@features/auth/queries/usePermissionDependencies";
import { useCloseVisit } from "@features/consulta-medica/modules/atencion/mutations/useCloseVisit";
import { useSaveDiagnosis } from "@features/consulta-medica/modules/atencion/mutations/useSaveDiagnosis";
import { useSavePrescriptions } from "@features/consulta-medica/modules/atencion/mutations/useSavePrescriptions";
import { useStartConsultation } from "@features/consulta-medica/modules/atencion/mutations/useStartConsultation";
import { useDoctorQueue } from "@features/consulta-medica/modules/atencion/queries/useDoctorQueue";
import type { VisitQueueItem } from "@api/types";

vi.mock(
  "@features/consulta-medica/modules/atencion/queries/useDoctorQueue",
  () => ({
    useDoctorQueue: vi.fn(),
  }),
);

vi.mock(
  "@features/consulta-medica/modules/atencion/mutations/useStartConsultation",
  () => ({
    useStartConsultation: vi.fn(),
  }),
);

vi.mock(
  "@features/consulta-medica/modules/atencion/mutations/useSaveDiagnosis",
  () => ({
    useSaveDiagnosis: vi.fn(),
  }),
);

vi.mock(
  "@features/consulta-medica/modules/atencion/mutations/useSavePrescriptions",
  () => ({
    useSavePrescriptions: vi.fn(),
  }),
);

vi.mock(
  "@features/consulta-medica/modules/atencion/mutations/useCloseVisit",
  () => ({
    useCloseVisit: vi.fn(),
  }),
);

vi.mock("@features/auth/queries/usePermissionDependencies", () => ({
  usePermissionDependencies: vi.fn(),
}));

const createVisit = (
  overrides: Partial<VisitQueueItem> = {},
): VisitQueueItem => ({
  id: 1,
  folio: "VST-2001",
  patientId: 2001,
  arrivalType: "appointment",
  serviceType: "medicina_general",
  appointmentId: "APP-2001",
  doctorId: 77,
  notes: "Paciente listo para valoracion",
  status: "lista_para_doctor",
  ...overrides,
});

describe("DoctorConsultationPage UI", () => {
  const startMutateAsync = vi.fn();
  const saveDiagnosisMutateAsync = vi.fn();
  const savePrescriptionsMutateAsync = vi.fn();
  const closeMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(usePermissionDependencies).mockReturnValue({
      hasCapability: () => true,
    } as unknown as ReturnType<typeof usePermissionDependencies>);

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

    vi.mocked(useSaveDiagnosis).mockReturnValue({
      mutateAsync: saveDiagnosisMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useSaveDiagnosis>);

    vi.mocked(useSavePrescriptions).mockReturnValue({
      mutateAsync: savePrescriptionsMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useSavePrescriptions>);

    vi.mocked(useCloseVisit).mockReturnValue({
      mutateAsync: closeMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCloseVisit>);

    startMutateAsync.mockResolvedValue({
      id: 1,
      folio: "VST-2001",
      patientId: 2001,
      arrivalType: "appointment",
      serviceType: "medicina_general",
      appointmentId: "APP-2001",
      doctorId: 77,
      notes: "Paciente listo para valoracion",
      status: "en_consulta",
    });

    saveDiagnosisMutateAsync.mockResolvedValue({
      visitId: 1,
      status: "en_consulta",
      primaryDiagnosis: "Infeccion respiratoria",
      finalNote: "Paciente estable al egreso.",
    });

    savePrescriptionsMutateAsync.mockResolvedValue({
      visitId: 1,
      status: "en_consulta",
      items: ["Paracetamol 500mg cada 8h"],
    });

    closeMutateAsync.mockResolvedValue({
      visit: {
        id: 1,
        folio: "VST-2001",
        patientId: 2001,
        arrivalType: "appointment",
        serviceType: "medicina_general",
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

  it("deshabilita carga de cola cuando no tiene permiso de lectura", () => {
    vi.mocked(usePermissionDependencies).mockReturnValue({
      hasCapability: () => false,
    } as unknown as ReturnType<typeof usePermissionDependencies>);

    vi.mocked(useDoctorQueue).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useDoctorQueue>);

    render(<DoctorConsultationPage />);

    expect(useDoctorQueue).toHaveBeenCalledWith({ enabled: false });
    expect(
      screen.getByText(
        "No tenes permisos completos para cargar la bandeja del doctor.",
      ),
    ).toBeVisible();
  });

  it("muestra aviso neutral y bloquea acciones clinicas cuando falta permiso de escritura", () => {
    vi.mocked(usePermissionDependencies).mockReturnValue({
      hasCapability: (capability: string) =>
        capability === "flow.doctor.queue.read",
    } as unknown as ReturnType<typeof usePermissionDependencies>);

    render(<DoctorConsultationPage />);

    expect(
      screen.getByText(
        "No tenes permisos completos para registrar diagnostico, receta o cierre de consulta.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Iniciar consulta" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Guardar borrador" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Guardar receta" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Finalizar consulta" }),
    ).toBeDisabled();
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

  it("guarda diagnostico cuando la visita esta en consulta", async () => {
    vi.mocked(useDoctorQueue).mockReturnValue({
      data: {
        items: [createVisit({ status: "en_consulta" })],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useDoctorQueue>);

    const user = userEvent.setup();
    render(<DoctorConsultationPage />);

    await user.click(screen.getByRole("tab", { name: "Diagnostico" }));
    await user.type(
      screen.getByLabelText("Diagnostico principal"),
      "Gastroenteritis aguda",
    );
    await user.type(
      screen.getByLabelText("Nota final"),
      "Paciente estable y con manejo ambulatorio.",
    );

    await user.click(screen.getByRole("button", { name: "Guardar borrador" }));

    await waitFor(() => {
      expect(saveDiagnosisMutateAsync).toHaveBeenCalledWith({
        visitId: 1,
        data: {
          primaryDiagnosis: "Gastroenteritis aguda",
          finalNote: "Paciente estable y con manejo ambulatorio.",
        },
      });
    });

    expect(
      screen.getByText("Diagnostico guardado correctamente."),
    ).toBeVisible();
    expect(screen.getByText("Diagnostico guardado")).toBeVisible();
  });

  it("guarda receta con una indicacion por linea", async () => {
    vi.mocked(useDoctorQueue).mockReturnValue({
      data: {
        items: [createVisit({ status: "en_consulta" })],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useDoctorQueue>);

    const user = userEvent.setup();
    render(<DoctorConsultationPage />);

    await user.click(screen.getByRole("tab", { name: "Receta medica" }));
    await user.type(
      screen.getByLabelText("Receta (una indicacion por linea)"),
      "Paracetamol 500mg cada 8h por 3 dias\nHidratacion oral libre",
    );

    await user.click(screen.getByRole("button", { name: "Guardar receta" }));

    await waitFor(() => {
      expect(savePrescriptionsMutateAsync).toHaveBeenCalledWith({
        visitId: 1,
        data: {
          items: [
            "Paracetamol 500mg cada 8h por 3 dias",
            "Hidratacion oral libre",
          ],
        },
      });
    });

    expect(screen.getByText("Receta guardada correctamente.")).toBeVisible();
    expect(screen.getByText("Receta guardada")).toBeVisible();
  });

  it("bloquea cierre hasta iniciar consulta y completar diagnostico + nota final", async () => {
    const user = userEvent.setup();
    render(<DoctorConsultationPage />);

    const closeButton = screen.getByRole("button", {
      name: "Finalizar consulta",
    });
    expect(closeButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Iniciar consulta" }));
    await waitFor(() => {
      expect(startMutateAsync).toHaveBeenCalledWith({ visitId: 1 });
    });

    await user.click(screen.getByRole("tab", { name: "Diagnostico" }));
    await user.type(screen.getByLabelText("Diagnostico principal"), "Dx");
    await user.type(screen.getByLabelText("Nota final"), "Nota clinica");

    await waitFor(() => {
      expect(closeButton).toBeEnabled();
    });
  });

  it("sincroniza diagnostico antes de cierre y luego cierra consulta", async () => {
    const user = userEvent.setup();
    render(<DoctorConsultationPage />);

    await user.click(screen.getByRole("button", { name: "Iniciar consulta" }));
    await waitFor(() => {
      expect(startMutateAsync).toHaveBeenCalledWith({ visitId: 1 });
    });

    await user.click(screen.getByRole("tab", { name: "Diagnostico" }));
    await user.type(screen.getByLabelText("Diagnostico principal"), "Dx final");
    await user.type(
      screen.getByLabelText("Nota final"),
      "Nota final de egreso",
    );
    await user.click(
      screen.getByRole("button", { name: "Finalizar consulta" }),
    );

    await waitFor(() => {
      expect(saveDiagnosisMutateAsync).toHaveBeenCalledWith({
        visitId: 1,
        data: {
          primaryDiagnosis: "Dx final",
          finalNote: "Nota final de egreso",
        },
      });
    });

    await waitFor(() => {
      expect(closeMutateAsync).toHaveBeenCalledWith({
        visitId: 1,
        data: {
          primaryDiagnosis: "Dx final",
          finalNote: "Nota final de egreso",
        },
      });
    });

    expect(screen.getByText("Consulta cerrada correctamente.")).toBeVisible();
    expect(screen.getByText("Consulta cerrada")).toBeVisible();
  });

  it("mapea errores de dominio en cierre de consulta", async () => {
    closeMutateAsync.mockRejectedValueOnce(
      new ApiError(
        "VISIT_STATE_INVALID",
        "VISIT_STATE_INVALID",
        409,
        undefined,
        "req-test",
      ),
    );

    const user = userEvent.setup();
    render(<DoctorConsultationPage />);

    await user.click(screen.getByRole("button", { name: "Iniciar consulta" }));
    await waitFor(() => {
      expect(startMutateAsync).toHaveBeenCalledWith({ visitId: 1 });
    });

    await user.click(screen.getByRole("tab", { name: "Diagnostico" }));
    await user.type(screen.getByLabelText("Diagnostico principal"), "Dx");
    await user.type(screen.getByLabelText("Nota final"), "Nota");
    await user.click(
      screen.getByRole("button", { name: "Finalizar consulta" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "La visita ya no esta en un estado valido para cerrar consulta.",
        ),
      ).toBeVisible();
    });
  });
});
