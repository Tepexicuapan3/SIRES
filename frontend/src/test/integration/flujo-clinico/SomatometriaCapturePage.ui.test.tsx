import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/utils";
import { ApiError } from "@api/utils/errors";
import { toast } from "sonner";
import SomatometriaCapturePage from "@features/somatometria/modules/captura/pages/SomatometriaCapturePage";
import { useSomatometriaQueue } from "@features/somatometria/modules/captura/queries/useSomatometriaQueue";
import { useSomatometriaWaitingQueue } from "@features/somatometria/modules/captura/queries/useSomatometriaWaitingQueue";
import { useCaptureVitals } from "@features/somatometria/modules/captura/mutations/useCaptureVitals";
import { useLatestVitals } from "@features/somatometria/modules/captura/queries/useLatestVitals";
import { useSomatometriaHistorial } from "@features/somatometria/modules/captura/queries/useSomatometriaHistorial";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import { usePatientLookupHistorico } from "@features/recepcion/modules/checkin/queries/usePatientLookup";
import type { TodayCapturePayload, VisitQueueItem } from "@api/types";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock(
  "@features/somatometria/modules/captura/queries/useSomatometriaQueue",
  () => ({
    useSomatometriaQueue: vi.fn(),
  }),
);

vi.mock(
  "@features/somatometria/modules/captura/queries/useSomatometriaWaitingQueue",
  () => ({
    useSomatometriaWaitingQueue: vi.fn(),
  }),
);

vi.mock(
  "@features/somatometria/modules/captura/mutations/useCaptureVitals",
  () => ({
    useCaptureVitals: vi.fn(),
  }),
);

vi.mock(
  "@features/somatometria/modules/captura/queries/useLatestVitals",
  () => ({
    useLatestVitals: vi.fn(),
  }),
);

vi.mock(
  "@features/somatometria/modules/captura/queries/useSomatometriaHistorial",
  () => ({
    useSomatometriaHistorial: vi.fn(),
  }),
);

vi.mock(
  "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList",
  () => ({
    useCentrosAtencionList: vi.fn(),
  }),
);

vi.mock("@/domains/auth-access/hooks/usePermissionDependencies", () => ({
  usePermissionDependencies: vi.fn(),
}));

vi.mock(
  "@features/recepcion/modules/checkin/queries/usePatientLookup",
  () => ({
    usePatientLookupHistorico: vi.fn(),
  }),
);

const createVisit = (
  overrides: Partial<VisitQueueItem> = {},
): VisitQueueItem => ({
  id:            1,
  folio:         "VST-1001",
  noExp:         "10001",
  pkNum:         0,
  arrivalType:   "appointment",
  serviceType:   "medicina_general",
  appointmentId: "APP-1001",
  doctorId:      90,
  notes:         "Paciente en observacion",
  status:        "en_somatometria",
  vitals:        null,
  ...overrides,
});

describe("SomatometriaCapturePage UI", () => {
  const captureMutateAsync = vi.fn();
  const getVitalsInput = (fieldId: string) => {
    return screen.getByTestId(`somato-${fieldId}-input`);
  };
  const expectVitalsFormReset = () => {
    expect(getVitalsInput("weightKg")).toHaveValue(null);
    expect(getVitalsInput("heightCm")).toHaveValue(null);
    expect(getVitalsInput("temperatureC")).toHaveValue(null);
    expect(getVitalsInput("oxygenSaturationPct")).toHaveValue(null);
    expect(screen.getByTestId("somato-bmi-input")).toHaveValue("--");
    expect(screen.getByTestId("somato-observations-input")).toHaveValue("");
  };

  beforeEach(() => {
    vi.clearAllMocks();

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

    vi.mocked(useSomatometriaWaitingQueue).mockReturnValue({
      data: { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useSomatometriaWaitingQueue>);

    vi.mocked(useCaptureVitals).mockReturnValue({
      mutateAsync: captureMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCaptureVitals>);

    vi.mocked(useLatestVitals).mockReturnValue({
      data: { vitals: null },
      isLoading: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof useLatestVitals>);

    vi.mocked(useCentrosAtencionList).mockReturnValue({
      data: { items: [], page: 1, pageSize: 500, total: 0, totalPages: 1 },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCentrosAtencionList>);

    vi.mocked(useSomatometriaHistorial).mockReturnValue({
      data: { items: [], page: 1, pageSize: 50, total: 0, totalPages: 1 },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSomatometriaHistorial>);

    // Default: SERMED disponible, sin dato de paciente cargado todavia --
    // los tests que necesitan edad/fecha nac. concretas sobreescriben esto.
    vi.mocked(usePatientLookupHistorico).mockReturnValue({
      data: undefined,
      isFetching: false,
    } as unknown as ReturnType<typeof usePatientLookupHistorico>);

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
    expect(screen.getByTestId("somato-save-button")).toBeDisabled();
  });

  it("renderiza estado loading", () => {
    vi.mocked(useSomatometriaQueue).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useSomatometriaQueue>);

    render(<SomatometriaCapturePage />);

    expect(screen.getByText("Cargando bandeja...")).toBeVisible();
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

    await user.click(screen.getByTestId("somato-save-button"));

    expect(screen.getByText("Ingresa el peso en kg.")).toBeVisible();
    expect(screen.getByText("Ingresa la talla en cm.")).toBeVisible();
    expect(screen.getByText("Ingresa la temperatura en C.")).toBeVisible();
    expect(screen.getByText("Ingresa la saturacion de O2.")).toBeVisible();
    expect(captureMutateAsync).not.toHaveBeenCalled();
  });

  it("guarda vitales cuando formulario es valido y resetea formulario", async () => {
    const user = userEvent.setup();
    render(<SomatometriaCapturePage />);

    await user.type(getVitalsInput("weightKg"), "70");
    await user.type(getVitalsInput("heightCm"), "175");
    await user.type(getVitalsInput("temperatureC"), "36.6");
    await user.type(getVitalsInput("oxygenSaturationPct"), "98");
    await user.type(
      screen.getByTestId("somato-observations-input"),
      "Paciente hidratado.",
    );

    await user.click(screen.getByTestId("somato-save-button"));

    await waitFor(() => {
      expect(captureMutateAsync).toHaveBeenCalledWith({
        visitId: 1,
        data: {
          weightKg: 70,
          heightCm: 175,
          temperatureC: 36.6,
          oxygenSaturationPct: 98,
          notes: "Paciente hidratado.",
        },
      });
    });

    expect(toast.success).toHaveBeenCalledWith(
      "Signos vitales guardados correctamente.",
      {
        description: "Visita VST-1001 actualizada.",
      },
    );

    await waitFor(() => {
      expectVitalsFormReset();
    });
  });

  it("muestra IMC estimado en tiempo real con peso y talla", async () => {
    const user = userEvent.setup();
    render(<SomatometriaCapturePage />);

    await user.type(getVitalsInput("weightKg"), "70");
    await user.type(getVitalsInput("heightCm"), "175");

    expect(screen.getByTestId("somato-bmi-input")).toHaveValue("22.86");
  });

  it("conserva vitales opcionales previos para evitar perdida de datos", async () => {
    vi.mocked(useLatestVitals).mockReturnValue({
      data: {
        vitals: {
          weightKg: 69,
          heightCm: 175,
          temperatureC: 36.5,
          oxygenSaturationPct: 99,
          heartRateBpm: 68,
          respiratoryRateBpm: 14,
          bloodPressureSystolic: 118,
          bloodPressureDiastolic: 76,
          waistCircumferenceCm: 89,
          glucosaCapilarMgdl: null,
          bmi: 22.53,
          capturedAt: "2026-08-01T00:00:00Z",
        },
      },
      isLoading: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof useLatestVitals>);

    const user = userEvent.setup();
    render(<SomatometriaCapturePage />);

    await user.clear(getVitalsInput("weightKg"));
    await user.type(getVitalsInput("weightKg"), "70");
    await user.clear(getVitalsInput("heightCm"));
    await user.type(getVitalsInput("heightCm"), "175");
    await user.clear(getVitalsInput("temperatureC"));
    await user.type(getVitalsInput("temperatureC"), "36.6");
    await user.clear(getVitalsInput("oxygenSaturationPct"));
    await user.type(getVitalsInput("oxygenSaturationPct"), "98");
    await user.click(screen.getByTestId("somato-save-button"));

    await waitFor(() => {
      expect(captureMutateAsync).toHaveBeenCalledWith({
        visitId: 1,
        data: {
          weightKg: 70,
          heightCm: 175,
          temperatureC: 36.6,
          oxygenSaturationPct: 98,
          heartRateBpm: 68,
          respiratoryRateBpm: 14,
          bloodPressureSystolic: 118,
          bloodPressureDiastolic: 76,
          waistCircumferenceCm: 89,
          notes: undefined,
        },
      });
    });
  });

  it("sobrescribe notes cuando se capturan observaciones en somatometria", async () => {
    vi.mocked(useSomatometriaQueue).mockReturnValue({
      data: {
        items: [
          createVisit({
            vitals: {
              weightKg: 69,
              heightCm: 175,
              temperatureC: 36.5,
              oxygenSaturationPct: 99,
              notes: "historial previo",
              bmi: 22.53,
              capturedAt: "2026-08-01T00:00:00Z",
              reusedFromVisitId: null,
              reusedFrom: null,
            },
          }),
        ],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useSomatometriaQueue>);

    const user = userEvent.setup();
    render(<SomatometriaCapturePage />);

    await user.type(getVitalsInput("weightKg"), "70");
    await user.type(getVitalsInput("heightCm"), "175");
    await user.type(getVitalsInput("temperatureC"), "36.6");
    await user.type(getVitalsInput("oxygenSaturationPct"), "98");
    await user.type(
      screen.getByTestId("somato-observations-input"),
      "Nueva observacion",
    );
    await user.click(screen.getByTestId("somato-save-button"));

    await waitFor(() => {
      expect(captureMutateAsync).toHaveBeenCalledWith({
        visitId: 1,
        data: {
          weightKg: 70,
          heightCm: 175,
          temperatureC: 36.6,
          oxygenSaturationPct: 98,
          notes: "Nueva observacion",
        },
      });
    });
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

      await user.type(getVitalsInput("weightKg"), "70");
      await user.type(getVitalsInput("heightCm"), "175");
      await user.type(getVitalsInput("temperatureC"), "36.6");
      await user.type(getVitalsInput("oxygenSaturationPct"), "98");
      await user.click(screen.getByTestId("somato-save-button"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("No se pudo guardar", {
          description: message,
        });
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
    expect(screen.getByTestId("somato-save-button")).toBeDisabled();
  });

  it("precarga el formulario por default con los valores de hoy pero sigue siendo editable -- nunca clona a ciegas", async () => {
    const todayCapture: TodayCapturePayload = {
      sourceVisitId: 42,
      sourceFolio: "VST-000042",
      sourceServiceType: "medicina_general",
      capturedAt: "2026-08-26T08:00:00Z",
      values: {
        weightKg: 70,
        heightCm: 175,
        temperatureC: 36.5,
        oxygenSaturationPct: 97,
        heartRateBpm: 72,
        respiratoryRateBpm: 16,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        waistCircumferenceCm: 90,
        glucosaCapilarMgdl: 95,
        bmi: 22.86,
      },
    };

    vi.mocked(useLatestVitals).mockReturnValue({
      data: { vitals: null, todayCapture },
      isLoading: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof useLatestVitals>);

    const user = userEvent.setup();
    render(<SomatometriaCapturePage />);

    // El formulario ya arranca precargado con los valores de hoy por
    // default -- no hace falta ningun click para verlos/usarlos.
    expect(getVitalsInput("weightKg")).toHaveValue(70);
    expect(getVitalsInput("heightCm")).toHaveValue(175);
    expect(getVitalsInput("temperatureC")).toHaveValue(36.5);
    expect(getVitalsInput("oxygenSaturationPct")).toHaveValue(97);

    // Pero sigue siendo editable: la enfermera corrige el peso antes de
    // guardar (el servidor/cliente nunca "clona ciegamente" el origen).
    await user.clear(getVitalsInput("weightKg"));
    await user.type(getVitalsInput("weightKg"), "72");

    await user.click(screen.getByTestId("somato-save-button"));

    await waitFor(() => {
      expect(captureMutateAsync).toHaveBeenCalledWith({
        visitId: 1,
        data: expect.objectContaining({
          weightKg: 72,
          reusedFromVisitId: 42,
        }),
      });
    });

    // El valor guardado es el EDITADO -- nunca el 70 original de
    // `todayCapture.values`.
    const savedPayload = captureMutateAsync.mock.calls[0][0].data;
    expect(savedPayload.weightKg).not.toBe(70);
    expect(savedPayload.weightKg).toBe(72);
  });

  it("'Pasar directo a consulta' guarda con un solo click los valores ya precargados, sin necesitar el boton Guardar aparte", async () => {
    const todayCapture: TodayCapturePayload = {
      sourceVisitId: 42,
      sourceFolio: "VST-000042",
      sourceServiceType: "medicina_general",
      capturedAt: "2026-08-26T08:00:00Z",
      values: {
        weightKg: 70,
        heightCm: 175,
        temperatureC: 36.5,
        oxygenSaturationPct: 97,
        heartRateBpm: 72,
        respiratoryRateBpm: 16,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        waistCircumferenceCm: 90,
        glucosaCapilarMgdl: 95,
        bmi: 22.86,
      },
    };

    vi.mocked(useLatestVitals).mockReturnValue({
      data: { vitals: null, todayCapture },
      isLoading: false,
      isSuccess: true,
    } as unknown as ReturnType<typeof useLatestVitals>);

    const user = userEvent.setup();
    render(<SomatometriaCapturePage />);

    // El formulario ya arranca precargado -- un unico click en "Pasar
    // directo a consulta" alcanza, sin tocar ningun campo ni el boton
    // Guardar por separado.
    await user.click(screen.getByTestId("today-capture-direct-button"));

    await waitFor(() => {
      expect(captureMutateAsync).toHaveBeenCalledWith({
        visitId: 1,
        data: expect.objectContaining({
          weightKg: 70,
          heightCm: 175,
          temperatureC: 36.5,
          oxygenSaturationPct: 97,
          reusedFromVisitId: 42,
        }),
      });
    });
  });

  describe("cola de espera (en_espera)", () => {
    it("muestra nombre y hora de llegada de los pacientes esperando pasar a somatometria", () => {
      vi.mocked(useSomatometriaWaitingQueue).mockReturnValue({
        data: {
          items: [
            createVisit({
              id: 99,
              folio: "VST-000099",
              nombrePaciente: "Carlos Ramirez",
              status: "en_espera",
              fechaAlta: "2026-08-26T08:15:00.000Z",
            }),
          ],
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        },
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useSomatometriaWaitingQueue>);

      render(<SomatometriaCapturePage />);

      expect(screen.getByText("Esperando pasar a somatometría")).toBeVisible();
      const waitingCard = screen.getByTestId("somato-waiting-card-99");
      expect(waitingCard).toHaveTextContent("Carlos Ramirez");
      expect(waitingCard).toHaveTextContent("Llegó a recepción:");
    });

    it("se muestra aunque no haya nadie en somatometria todavia (secciones independientes)", () => {
      vi.mocked(useSomatometriaQueue).mockReturnValue({
        data: { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 },
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useSomatometriaQueue>);

      vi.mocked(useSomatometriaWaitingQueue).mockReturnValue({
        data: {
          items: [createVisit({ id: 5, status: "en_espera" })],
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        },
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useSomatometriaWaitingQueue>);

      render(<SomatometriaCapturePage />);

      expect(screen.getByText("No hay pacientes en somatometria.")).toBeVisible();
      expect(screen.getByTestId("somato-waiting-card-5")).toBeVisible();
    });

    it("muestra estado vacio cuando no hay nadie esperando", () => {
      render(<SomatometriaCapturePage />);

      expect(
        screen.getByText("No hay pacientes esperando pasar a somatometria."),
      ).toBeVisible();
    });
  });

  // Task 2.11 (P2, somatometria-modulo-integral) + design D5: la edad y la
  // fecha de nacimiento se leen EN VIVO de SERMED (`usePatientLookupHistorico`)
  // en cada render de la ficha, nunca se congelan en el check-in. No hay
  // cambio de codigo en el componente -- este bloque solo verifica el
  // comportamiento ya existente.
  describe("edad en vivo desde SERMED (D5)", () => {
    it("muestra la edad resuelta por SERMED para el integrante seleccionado", () => {
      vi.mocked(usePatientLookupHistorico).mockReturnValue({
        data: {
          titular: {
            noExp:      "10001",
            pkNum:      0,
            nombre:     "Paciente Uno",
            edad:       34,
            fechaNac:   "1992-01-15",
            parentesco: null,
            estatus:    "activo",
            cdClinica:  null,
          },
          dependientes: [],
        },
        isFetching: false,
      } as unknown as ReturnType<typeof usePatientLookupHistorico>);

      render(<SomatometriaCapturePage />);

      expect(screen.getByText("34 años")).toBeVisible();
      expect(screen.getByText("15/01/1992")).toBeVisible();
    });

    it("degrada la edad sin bloquear el resto de la ficha cuando SERMED falla o no responde", () => {
      vi.mocked(usePatientLookupHistorico).mockReturnValue({
        data: undefined,
        isFetching: false,
      } as unknown as ReturnType<typeof usePatientLookupHistorico>);

      render(<SomatometriaCapturePage />);

      // Nunca muestra una edad -- ni la real ni una stale -- cuando SERMED
      // no respondio.
      expect(screen.queryByText(/\d+ años/)).not.toBeInTheDocument();

      // El resto de la ficha (datos de la visita + formulario de captura)
      // sigue siendo completamente funcional: la falla de SERMED es
      // aislada, no bloquea nada mas.
      expect(screen.getByTestId("somato-weightKg-input")).toBeEnabled();
      expect(screen.getByTestId("somato-save-button")).toBeVisible();
    });

    it("no bloquea el render mientras SERMED todavia esta resolviendo (isFetching)", () => {
      vi.mocked(usePatientLookupHistorico).mockReturnValue({
        data: undefined,
        isFetching: true,
      } as unknown as ReturnType<typeof usePatientLookupHistorico>);

      render(<SomatometriaCapturePage />);

      // Estado transitorio explicito ("...") -- no un crash ni un valor
      // adivinado -- y el formulario de captura sigue disponible.
      expect(screen.getByTestId("somato-weightKg-input")).toBeVisible();
      expect(screen.getByTestId("somato-save-button")).toBeVisible();
    });
  });

  describe("tab switcher (Cola / Historial)", () => {
    it("muestra la cola por defecto (cola de espera + formulario de captura)", () => {
      render(<SomatometriaCapturePage />);

      expect(screen.getByText("Esperando pasar a somatometría")).toBeVisible();
      expect(screen.getByText("En somatometría")).toBeVisible();
      expect(screen.queryByTestId("somato-historial-view")).not.toBeInTheDocument();
    });

    it("cambia a la vista de historial al hacer click en la pestana Historial y oculta la cola", async () => {
      const user = userEvent.setup();
      render(<SomatometriaCapturePage />);

      await user.click(screen.getByTestId("somato-tab-historial"));

      expect(screen.getByTestId("somato-historial-view")).toBeVisible();
      expect(screen.queryByText("Esperando pasar a somatometría")).not.toBeInTheDocument();
      expect(screen.queryByText("En somatometría")).not.toBeInTheDocument();
    });

    it("vuelve a mostrar la cola al hacer click de nuevo en la pestana Cola", async () => {
      const user = userEvent.setup();
      render(<SomatometriaCapturePage />);

      await user.click(screen.getByTestId("somato-tab-historial"));
      expect(screen.getByTestId("somato-historial-view")).toBeVisible();

      await user.click(screen.getByTestId("somato-tab-cola"));

      expect(screen.queryByTestId("somato-historial-view")).not.toBeInTheDocument();
      expect(screen.getByText("Esperando pasar a somatometría")).toBeVisible();
    });
  });
});
