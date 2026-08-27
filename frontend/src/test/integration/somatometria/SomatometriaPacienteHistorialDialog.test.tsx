import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { server } from "@/test/mocks/server";
import { getApiUrl } from "@/test/mocks/urls";
import { render, screen, waitFor } from "@/test/utils";
import {
  ARRIVAL_TYPE,
  VISIT_SERVICE,
  VISIT_STATUS,
  type VisitQueueItem,
} from "@api/types/visits.types";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import { useEditVitals } from "@features/somatometria/modules/captura/mutations/useEditVitals";
import { SomatometriaPacienteHistorialDialog } from "@features/somatometria/modules/captura/components/SomatometriaPacienteHistorialDialog";

vi.mock("@/domains/auth-access/hooks/usePermissionDependencies", () => ({
  usePermissionDependencies: vi.fn(),
}));

vi.mock(
  "@features/somatometria/modules/captura/mutations/useEditVitals",
  () => ({
    useEditVitals: vi.fn(),
  }),
);

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const buildVisit = (
  id: number,
  overrides: Partial<VisitQueueItem> = {},
): VisitQueueItem => ({
  id,
  folio: `VST-${id}`,
  noExp: "100",
  pkNum: 2,
  nombrePaciente: "Dependiente Dos",
  arrivalType: ARRIVAL_TYPE.WALK_IN,
  serviceType: VISIT_SERVICE.MEDICINA_GENERAL,
  appointmentId: null,
  doctorId: null,
  doctorNombre: null,
  consultorioId: null,
  consultorioNombre: null,
  centroId: null,
  centroNombre: null,
  notes: null,
  horaConsulta: null,
  fechaConsulta: null,
  fechaCita: null,
  numFicha: null,
  turnoNombre: "",
  status: VISIT_STATUS.CERRADA,
  fechaAlta: "2026-01-10T10:00:00.000Z",
  enSomatometriaAt: null,
  createdById: null,
  vitals: null,
  ...overrides,
});

describe("SomatometriaPacienteHistorialDialog (D14 — historial por-paciente, sin endpoint nuevo)", () => {
  beforeEach(() => {
    vi.mocked(usePermissionDependencies).mockReturnValue({
      hasCapability: () => false,
    } as unknown as ReturnType<typeof usePermissionDependencies>);

    vi.mocked(useEditVitals).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useEditVitals>);
  });

  it("invoca GET /visits?noExp=100&pkNum=2&pageSize=50 y ningun otro endpoint, respetando el orden -id_visit del backend", async () => {
    const requestedUrls: string[] = [];
    // Backend ya devuelve orden -id_visit por default (list_paginated) --
    // el mock respeta ese contrato: mas reciente (id mayor) primero.
    const mockItems = [buildVisit(303), buildVisit(302), buildVisit(301)];

    server.use(
      http.get(getApiUrl("visits"), ({ request }) => {
        requestedUrls.push(request.url);
        return HttpResponse.json({
          items: mockItems,
          page: 1,
          pageSize: 50,
          total: mockItems.length,
          totalPages: 1,
        });
      }),
    );

    render(
      <SomatometriaPacienteHistorialDialog
        open
        onOpenChange={() => {}}
        noExp="100"
        pkNum={2}
        nombrePaciente="Dependiente Dos"
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("somato-paciente-historial-list"),
      ).toBeInTheDocument();
    });

    // Exactamente 1 request a /visits, con los parametros exactos del
    // escenario de spec (D14): noExp=100, pkNum=2, pageSize=50.
    expect(requestedUrls).toHaveLength(1);
    const url = new URL(requestedUrls[0]);
    expect(url.pathname).toContain("/visits");
    expect(url.searchParams.get("noExp")).toBe("100");
    expect(url.searchParams.get("pkNum")).toBe("2");
    expect(url.searchParams.get("pageSize")).toBe("50");

    // El orden que devuelve el backend (-id_visit) se respeta tal cual en
    // el render -- el componente no reordena client-side.
    const renderedIds = mockItems.map((visit) =>
      screen.getByTestId(`somato-paciente-historial-item-${visit.id}`),
    );
    expect(renderedIds).toHaveLength(3);
    const listContainer = screen.getByTestId(
      "somato-paciente-historial-list",
    );
    const domOrderIds = Array.from(
      listContainer.querySelectorAll("[data-testid^='somato-paciente-historial-item-']"),
    ).map((el) => el.getAttribute("data-testid"));
    expect(domOrderIds).toEqual([
      "somato-paciente-historial-item-303",
      "somato-paciente-historial-item-302",
      "somato-paciente-historial-item-301",
    ]);
  });

  it("pkNum=0 (titular) viaja explicito -- no se omite como si fuera 'ausente'", async () => {
    // Gotcha D13: si el hook tratara pkNum=0 como falsy y lo omitiera del
    // query string, el backend interpretaria "sin filtro de pkNum" y
    // devolveria TODOS los integrantes de la familia, no solo el titular.
    const requestedUrls: string[] = [];

    server.use(
      http.get(getApiUrl("visits"), ({ request }) => {
        requestedUrls.push(request.url);
        return HttpResponse.json({
          items: [buildVisit(401, { pkNum: 0, nombrePaciente: "Titular" })],
          page: 1,
          pageSize: 50,
          total: 1,
          totalPages: 1,
        });
      }),
    );

    render(
      <SomatometriaPacienteHistorialDialog
        open
        onOpenChange={() => {}}
        noExp="100"
        pkNum={0}
        nombrePaciente="Titular"
      />,
    );

    await waitFor(() => {
      expect(requestedUrls.length).toBeGreaterThan(0);
    });

    const url = new URL(requestedUrls[0]);
    expect(url.searchParams.has("pkNum")).toBe(true);
    expect(url.searchParams.get("pkNum")).toBe("0");
  });

  it("no dispara ningun fetch cuando noExp es undefined (enabled: Boolean(noExp))", async () => {
    const requestedUrls: string[] = [];

    server.use(
      http.get(getApiUrl("visits"), ({ request }) => {
        requestedUrls.push(request.url);
        return HttpResponse.json({
          items: [],
          page: 1,
          pageSize: 50,
          total: 0,
          totalPages: 0,
        });
      }),
    );

    render(
      <SomatometriaPacienteHistorialDialog
        open
        onOpenChange={() => {}}
        noExp={undefined}
        pkNum={undefined}
        nombrePaciente={null}
      />,
    );

    // Pequeña espera para confirmar ausencia de fetch (no hay un elemento
    // positivo que esperar aca -- el hook nunca deberia dispararse).
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(requestedUrls).toHaveLength(0);
  });
});

describe("SomatometriaPacienteHistorialDialog — edicion auditada (Fase 3.9, cierre de gap UI)", () => {
  const visitWithVitals = buildVisit(501, {
    vitals: {
      weightKg: 70,
      heightCm: 170,
      bmi: 24.2,
      temperatureC: 36.5,
      oxygenSaturationPct: 98,
      heartRateBpm: 72,
      respiratoryRateBpm: 16,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      glucosaCapilarMgdl: null,
      waistCircumferenceCm: null,
      notes: null,
      capturedAt: "2026-01-10T10:05:00.000Z",
      reusedFromVisitId: null,
      reusedFrom: null,
    },
  });

  const renderWithVitals = () => {
    server.use(
      http.get(getApiUrl("visits"), () =>
        HttpResponse.json({
          items: [visitWithVitals],
          page: 1,
          pageSize: 50,
          total: 1,
          totalPages: 1,
        }),
      ),
    );

    return render(
      <SomatometriaPacienteHistorialDialog
        open
        onOpenChange={() => {}}
        noExp="100"
        pkNum={2}
        nombrePaciente="Dependiente Dos"
      />,
    );
  };

  it("no muestra el boton Editar sin la capability flow.somatometria.edit", async () => {
    vi.mocked(usePermissionDependencies).mockReturnValue({
      hasCapability: () => false,
    } as unknown as ReturnType<typeof usePermissionDependencies>);

    renderWithVitals();

    await waitFor(() => {
      expect(
        screen.getByTestId("somato-paciente-historial-item-501"),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId("somato-paciente-historial-edit-501"),
    ).not.toBeInTheDocument();
  });

  it("pide confirmacion antes de guardar y rechaza enviar sin motivo", async () => {
    vi.mocked(usePermissionDependencies).mockReturnValue({
      hasCapability: (capability: string) =>
        capability === "flow.somatometria.edit",
    } as unknown as ReturnType<typeof usePermissionDependencies>);

    const mutateAsync = vi.fn();
    vi.mocked(useEditVitals).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useEditVitals>);

    const user = userEvent.setup();
    renderWithVitals();

    await waitFor(() => {
      expect(
        screen.getByTestId("somato-paciente-historial-edit-501"),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("somato-paciente-historial-edit-501"));
    expect(screen.getByTestId("edit-vitals-dialog")).toBeVisible();

    // Sin motivo: el submit del form no debe abrir el AlertDialog de
    // confirmacion ni llamar a la mutacion -- la validacion zod bloquea
    // antes de llegar a "pedir confirmacion".
    await user.click(screen.getByTestId("edit-vitals-submit-button"));

    expect(
      screen.queryByTestId("edit-vitals-confirm-dialog"),
    ).not.toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();

    // Con motivo valido: el submit SI abre la confirmacion, y la mutacion
    // todavia no se disparo (falta el segundo click de "Confirmar").
    await user.type(
      screen.getByTestId("edit-vitals-motivo-input"),
      "Se corrigio la presion diastolica tras verificar con el paciente.",
    );
    await user.click(screen.getByTestId("edit-vitals-submit-button"));

    expect(
      await screen.findByTestId("edit-vitals-confirm-dialog"),
    ).toBeVisible();
    expect(mutateAsync).not.toHaveBeenCalled();

    await user.click(screen.getByTestId("edit-vitals-confirm-button"));
    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        visitId: 501,
        data: expect.objectContaining({
          motivo: "Se corrigio la presion diastolica tras verificar con el paciente.",
        }),
      }),
    );
  });
});
