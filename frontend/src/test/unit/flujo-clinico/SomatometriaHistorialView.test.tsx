import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test/utils";
import { SomatometriaHistorialView } from "@features/somatometria/modules/captura/components/SomatometriaHistorialView";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import { useSomatometriaHistorial } from "@features/somatometria/modules/captura/queries/useSomatometriaHistorial";
import type { VisitQueueItem } from "@api/types";

vi.mock(
  "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList",
  () => ({
    useCentrosAtencionList: vi.fn(),
  }),
);

vi.mock(
  "@features/somatometria/modules/captura/queries/useSomatometriaHistorial",
  () => ({
    useSomatometriaHistorial: vi.fn(),
  }),
);

const buildVisit = (
  overrides: Partial<VisitQueueItem> = {},
): VisitQueueItem => ({
  id: 1,
  folio: "VST-200001",
  noExp: "20001",
  pkNum: 0,
  nombrePaciente: "Maria Lopez",
  arrivalType: "appointment",
  serviceType: "medicina_general",
  appointmentId: "APP-1",
  doctorId: null,
  doctorNombre: null,
  consultorioId: null,
  consultorioNombre: null,
  centroId: 1,
  centroNombre: "Centro Central",
  notes: null,
  horaConsulta: null,
  fechaConsulta: null,
  fechaCita: null,
  numFicha: null,
  turnoNombre: "Matutino",
  status: "cerrada",
  fechaAlta: "2026-08-26T13:00:00.000Z",
  enSomatometriaAt: "2026-08-26T13:05:00.000Z",
  createdById: null,
  vitals: {
    weightKg: 70,
    heightCm: 175,
    temperatureC: 36.5,
    oxygenSaturationPct: 98,
    bmi: 22.86,
    capturedAt: "2026-08-26T13:10:00.000Z",
    reusedFromVisitId: null,
    reusedFrom: null,
  },
  ...overrides,
});

const buildHistorialResult = (
  items: VisitQueueItem[],
  overrides: Partial<{
    page: number;
    total: number;
    totalPages: number;
    isLoading: boolean;
    isError: boolean;
  }> = {},
) => ({
  data: {
    items,
    page: overrides.page ?? 1,
    pageSize: 50,
    total: overrides.total ?? items.length,
    totalPages: overrides.totalPages ?? 1,
  },
  isLoading: overrides.isLoading ?? false,
  isError: overrides.isError ?? false,
});

describe("SomatometriaHistorialView", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useCentrosAtencionList).mockReturnValue({
      data: {
        items: [
          { id: 1, name: "Centro Central" },
          { id: 2, name: "Centro Norte" },
        ],
        page: 1,
        pageSize: 500,
        total: 2,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCentrosAtencionList>);

    vi.mocked(useSomatometriaHistorial).mockReturnValue(
      buildHistorialResult([buildVisit()]) as unknown as ReturnType<
        typeof useSomatometriaHistorial
      >,
    );
  });

  it("renderiza una ficha por visita con nombre del paciente y fecha de captura de vitales", () => {
    render(<SomatometriaHistorialView />);

    const card = screen.getByTestId("somato-historial-card-1");
    expect(card).toHaveTextContent("Maria Lopez");
    expect(card).toHaveTextContent("20001");
    expect(card).toHaveTextContent("Signos vitales capturados:");

    const expectedFormatted = new Date(
      "2026-08-26T13:10:00.000Z",
    ).toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    expect(card).toHaveTextContent(expectedFormatted);
  });

  it("oculta visitas que todavia no tienen vitales capturados (vitals === null)", () => {
    vi.mocked(useSomatometriaHistorial).mockReturnValue(
      buildHistorialResult([
        buildVisit({ id: 1, vitals: null }),
        buildVisit({ id: 2, nombrePaciente: "Con vitales" }),
      ]) as unknown as ReturnType<typeof useSomatometriaHistorial>,
    );

    render(<SomatometriaHistorialView />);

    expect(screen.queryByTestId("somato-historial-card-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("somato-historial-card-2")).toBeVisible();
  });

  it("filtra por centro de atencion como parametro REAL de backend (D3/D13, ya no client-side)", async () => {
    // Regresion: antes esta vista traia TODAS las visitas del rango y
    // filtraba `centroId` 100% client-side sobre la pagina ya traida. Ahora
    // `centroId` viaja como parametro real a `useSomatometriaHistorial` (que
    // a su vez lo pasa a `GET /visits`) -- el componente ya NO filtra nada
    // el mismo por su cuenta.
    vi.mocked(useSomatometriaHistorial).mockReturnValue(
      buildHistorialResult([
        buildVisit({ id: 1, centroId: 1, centroNombre: "Centro Central" }),
      ]) as unknown as ReturnType<typeof useSomatometriaHistorial>,
    );

    const user = userEvent.setup();
    render(<SomatometriaHistorialView />);

    expect(useSomatometriaHistorial).toHaveBeenLastCalledWith(
      expect.objectContaining({ centroId: undefined }),
    );

    await user.click(
      screen.getByRole("combobox", { name: "Centro de atención" }),
    );
    await user.click(screen.getByRole("option", { name: "Centro Norte" }));

    expect(useSomatometriaHistorial).toHaveBeenLastCalledWith(
      expect.objectContaining({ centroId: 2 }),
    );
  });

  it("respeta el rango de fecha desde/hasta -- pasa fechaDesde/fechaHasta al hook de historial", async () => {
    const user = userEvent.setup();
    render(<SomatometriaHistorialView />);

    const desdeInput = screen.getByLabelText("Desde") as HTMLInputElement;
    const hastaInput = screen.getByLabelText(/Hasta/) as HTMLInputElement;

    await user.clear(desdeInput);
    await user.type(desdeInput, "2026-08-01");
    await user.clear(hastaInput);
    await user.type(hastaInput, "2026-08-20");

    expect(useSomatometriaHistorial).toHaveBeenLastCalledWith(
      expect.objectContaining({
        fechaDesde: "2026-08-01",
        fechaHasta: "2026-08-20",
      }),
    );
  });

  it("muestra estado de carga", () => {
    vi.mocked(useSomatometriaHistorial).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useSomatometriaHistorial>);

    render(<SomatometriaHistorialView />);

    expect(screen.getByText("Cargando historial...")).toBeVisible();
  });

  it("muestra estado de error", () => {
    vi.mocked(useSomatometriaHistorial).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useSomatometriaHistorial>);

    render(<SomatometriaHistorialView />);

    expect(
      screen.getByText("No se pudo cargar el historial de signos vitales."),
    ).toBeVisible();
  });

  it("muestra estado vacio cuando no hay fichas con vitales para los filtros aplicados", () => {
    vi.mocked(useSomatometriaHistorial).mockReturnValue(
      buildHistorialResult([]) as unknown as ReturnType<
        typeof useSomatometriaHistorial
      >,
    );

    render(<SomatometriaHistorialView />);

    expect(
      screen.getByText(
        "Sin signos vitales capturados para el rango y centro seleccionados.",
      ),
    ).toBeVisible();
  });

  it("aplica el preset 'Semana' recalculando fechaDesde/fechaHasta en fecha local (D12)", async () => {
    const user = userEvent.setup();
    render(<SomatometriaHistorialView />);

    await user.click(screen.getByTestId("somato-hist-preset-semana"));

    expect(useSomatometriaHistorial).toHaveBeenLastCalledWith(
      expect.objectContaining({
        fechaDesde: expect.any(String),
        fechaHasta: expect.any(String),
      }),
    );
    const lastCallArgs = vi.mocked(useSomatometriaHistorial).mock.calls.at(-1);
    const params = lastCallArgs?.[0] as { fechaDesde: string; fechaHasta: string };
    expect(params.fechaDesde <= params.fechaHasta).toBe(true);
  });

  it("abre el historial del paciente al hacer click en una tarjeta (D14)", async () => {
    const user = userEvent.setup();
    render(<SomatometriaHistorialView />);

    await user.click(screen.getByTestId("somato-historial-card-1"));

    expect(
      await screen.findByTestId("somato-paciente-historial-dialog"),
    ).toBeVisible();
    expect(screen.getByText(/Historial de Maria Lopez/)).toBeVisible();
  });

  it("muestra paginacion cuando hay mas de una pagina y navega con Siguiente/Anterior", async () => {
    vi.mocked(useSomatometriaHistorial).mockReturnValue(
      buildHistorialResult([buildVisit()], {
        page: 1,
        total: 120,
        totalPages: 3,
      }) as unknown as ReturnType<typeof useSomatometriaHistorial>,
    );

    const user = userEvent.setup();
    render(<SomatometriaHistorialView />);

    expect(screen.getByText("120 ficha(s) · página 1 de 3")).toBeVisible();
    const anteriorButton = screen.getByRole("button", { name: "Anterior" });
    const siguienteButton = screen.getByRole("button", { name: "Siguiente" });
    expect(anteriorButton).toBeDisabled();
    expect(siguienteButton).not.toBeDisabled();

    await user.click(siguienteButton);

    expect(useSomatometriaHistorial).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
    );
  });
});
