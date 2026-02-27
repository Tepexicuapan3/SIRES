import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/utils";
import { ApiError } from "@api/utils/errors";
import SomatometriaCapturePage from "@features/flujo-clinico/pages/SomatometriaCapturePage";
import { useSomatometriaQueue } from "@features/somatometria/modules/captura/queries/useSomatometriaQueue";
import { useCaptureVitals } from "@features/somatometria/modules/captura/mutations/useCaptureVitals";
import { usePermissionDependencies } from "@features/auth/queries/usePermissionDependencies";
import type { VisitQueueItem } from "@api/types";

vi.mock(
  "@features/somatometria/modules/captura/queries/useSomatometriaQueue",
  () => ({
    useSomatometriaQueue: vi.fn(),
  }),
);

vi.mock(
  "@features/somatometria/modules/captura/mutations/useCaptureVitals",
  () => ({
    useCaptureVitals: vi.fn(),
  }),
);

vi.mock("@features/auth/queries/usePermissionDependencies", () => ({
  usePermissionDependencies: vi.fn(),
}));

const createVisit = (
  overrides: Partial<VisitQueueItem> = {},
): VisitQueueItem => ({
  id: 1,
  folio: "VST-1001",
  patientId: 1001,
  arrivalType: "appointment",
  serviceType: "medicina_general",
  appointmentId: "APP-1001",
  doctorId: 90,
  notes: "Paciente en observacion",
  status: "en_somatometria",
  ...overrides,
});

describe("SomatometriaCapturePage UI", () => {
  const captureMutateAsync = vi.fn();

  beforeEach(() => {
    vi.mocked(usePermissionDependencies).mockReturnValue({
      hasCapability: () => true,
    } as unknown as ReturnType<typeof usePermissionDependencies>);

    vi.mocked(useSomatometriaQueue).mockReturnValue({
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
    } as unknown as ReturnType<typeof useSomatometriaQueue>);

    vi.mocked(useCaptureVitals).mockReturnValue({
      mutateAsync: captureMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCaptureVitals>);

    captureMutateAsync.mockResolvedValue({
      visitId: 1,
      status: "lista_para_doctor",
      vitals: {
        weightKg: 70,
        heightCm: 175,
        temperatureC: 36.6,
        oxygenSaturationPct: 98,
        bmi: 22.86,
      },
    });
  });

  it("deshabilita la consulta cuando falta capability para leer bandeja", () => {
    vi.mocked(usePermissionDependencies).mockReturnValue({
      hasCapability: () => false,
    } as unknown as ReturnType<typeof usePermissionDependencies>);

    vi.mocked(useSomatometriaQueue).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useSomatometriaQueue>);

    render(<SomatometriaCapturePage />);

    expect(useSomatometriaQueue).toHaveBeenCalledWith({ enabled: false });
    expect(
      screen.getByText(
        "No tenes permisos completos para cargar la bandeja de somatometria.",
      ),
    ).toBeVisible();
  });

  it("muestra aviso neutral cuando falta permiso para guardar vitales", () => {
    vi.mocked(usePermissionDependencies).mockReturnValue({
      hasCapability: (capability: string) =>
        capability === "flow.somatometria.queue.read",
    } as unknown as ReturnType<typeof usePermissionDependencies>);

    render(<SomatometriaCapturePage />);

    expect(
      screen.getByText("No tenes permisos completos para guardar vitales."),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("renderiza estado loading", () => {
    vi.mocked(useSomatometriaQueue).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useSomatometriaQueue>);

    render(<SomatometriaCapturePage />);

    expect(
      screen.getByText("Cargando bandeja de somatometria..."),
    ).toBeVisible();
  });

  it("renderiza estado empty", () => {
    vi.mocked(useSomatometriaQueue).mockReturnValue({
      data: { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useSomatometriaQueue>);

    render(<SomatometriaCapturePage />);

    expect(screen.getByText("No hay pacientes en somatometria.")).toBeVisible();
  });

  it("renderiza estado error", () => {
    vi.mocked(useSomatometriaQueue).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("request failed"),
    } as unknown as ReturnType<typeof useSomatometriaQueue>);

    render(<SomatometriaCapturePage />);

    expect(
      screen.getByText("No se pudo cargar la bandeja de somatometria."),
    ).toBeVisible();
  });

  it("valida los campos criticos de vitales", async () => {
    const user = userEvent.setup();
    render(<SomatometriaCapturePage />);

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByText("Ingresa el peso en kg.")).toBeVisible();
    expect(screen.getByText("Ingresa la talla en cm.")).toBeVisible();
    expect(screen.getByText("Ingresa la temperatura en C.")).toBeVisible();
    expect(screen.getByText("Ingresa la saturacion de O2.")).toBeVisible();
    expect(captureMutateAsync).not.toHaveBeenCalled();
  });

  it("guarda vitales cuando formulario es valido", async () => {
    const user = userEvent.setup();
    render(<SomatometriaCapturePage />);

    await user.type(screen.getByLabelText("Peso"), "70");
    await user.type(screen.getByLabelText("Estatura"), "175");
    await user.type(screen.getByLabelText("Temperatura"), "36.6");
    await user.type(screen.getByLabelText("Saturacion de oxigeno"), "98");

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(captureMutateAsync).toHaveBeenCalledWith({
        visitId: 1,
        data: {
          weightKg: 70,
          heightCm: 175,
          temperatureC: 36.6,
          oxygenSaturationPct: 98,
          heartRateBpm: undefined,
          respiratoryRateBpm: undefined,
          bloodPressureSystolic: undefined,
          bloodPressureDiastolic: undefined,
          waistCircumferenceCm: undefined,
          notes: undefined,
        },
      });
    });

    expect(
      screen.getByText("Signos vitales guardados correctamente."),
    ).toBeVisible();
    expect(screen.getByText("IMC calculado: 22.86")).toBeVisible();
  });

  it("muestra IMC estimado en tiempo real con peso y talla", async () => {
    const user = userEvent.setup();
    render(<SomatometriaCapturePage />);

    await user.type(screen.getByLabelText("Peso"), "70");
    await user.type(screen.getByLabelText("Estatura"), "175");

    expect(screen.getByText("IMC calculado: 22.86")).toBeVisible();
  });

  const domainErrors = [
    {
      code: "VITALS_INCOMPLETE",
      message:
        "No se puede liberar la visita: completa los vitales minimos requeridos.",
    },
    {
      code: "ROLE_NOT_ALLOWED",
      message: "No tenes permiso para capturar vitales en esta visita.",
    },
    {
      code: "VISIT_STATE_INVALID",
      message:
        "La visita ya no esta en un estado valido para somatometria. Actualiza la bandeja.",
    },
  ] as const;

  it.each(domainErrors)(
    "muestra mensaje UX para error de dominio $code",
    async ({ code, message }) => {
      captureMutateAsync.mockRejectedValueOnce(
        new ApiError(code, code, 409, undefined, "req-test"),
      );

      const user = userEvent.setup();
      render(<SomatometriaCapturePage />);

      await user.type(screen.getByLabelText("Peso"), "70");
      await user.type(screen.getByLabelText("Estatura"), "175");
      await user.type(screen.getByLabelText("Temperatura"), "36.6");
      await user.type(screen.getByLabelText("Saturacion de oxigeno"), "98");
      await user.click(screen.getByRole("button", { name: "Guardar" }));

      await waitFor(() => {
        expect(screen.getByText(message)).toBeVisible();
      });
    },
  );

  it("bloquea captura cuando visita no esta en estado en_somatometria", () => {
    vi.mocked(useSomatometriaQueue).mockReturnValue({
      data: {
        items: [createVisit({ status: "en_espera" })],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useSomatometriaQueue>);

    render(<SomatometriaCapturePage />);

    expect(
      screen.getByText(
        "Selecciona una visita en somatometria para capturar vitales.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });
});
