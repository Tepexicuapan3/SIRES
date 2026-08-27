import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { act, render, screen } from "@/test/utils";
import { SomatometriaQueueCards } from "@features/somatometria/modules/captura/components/SomatometriaQueueCards";
import type { VisitQueueItem } from "@api/types";

const buildVisit = (
  overrides: Partial<VisitQueueItem> = {},
): VisitQueueItem => ({
  id: 1,
  folio: "VST-100001",
  noExp: "10001",
  pkNum: 0,
  nombrePaciente: "Juana Perez",
  arrivalType: "appointment",
  serviceType: "medicina_general",
  appointmentId: "APP-1",
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
  turnoNombre: "Matutino",
  status: "en_somatometria",
  fechaAlta: "2026-08-26T14:05:00.000Z",
  enSomatometriaAt: "2026-08-26T14:12:00.000Z",
  createdById: null,
  vitals: null,
  fechaModf: null,
  ...overrides,
});

describe("SomatometriaQueueCards", () => {
  it("renderiza nombre, expediente+familiar, hora y servicio por tarjeta", () => {
    render(
      <SomatometriaQueueCards
        visits={[
          buildVisit({
            id: 1,
            folio: "VST-100001",
            nombrePaciente: "Juana Perez",
            noExp: "10001",
            pkNum: 2,
            serviceType: "especialidad",
          }),
        ]}
        selectedVisitId={null}
        onSelectVisit={vi.fn()}
      />,
    );

    const card = screen.getByTestId("somato-visit-card-1");
    expect(card).toHaveTextContent("Juana Perez");
    expect(card).toHaveTextContent("10001");
    expect(card).toHaveTextContent("Familiar #2");
    expect(card).toHaveTextContent("Especialidad");
    expect(card).toHaveAttribute("data-visit-folio", "VST-100001");
  });

  it("identifica al titular cuando pkNum es 0", () => {
    render(
      <SomatometriaQueueCards
        visits={[buildVisit({ id: 2, pkNum: 0 })]}
        selectedVisitId={null}
        onSelectVisit={vi.fn()}
      />,
    );

    expect(screen.getByTestId("somato-visit-card-2")).toHaveTextContent(
      "Titular",
    );
  });

  it("marca la tarjeta seleccionada con aria-pressed", () => {
    render(
      <SomatometriaQueueCards
        visits={[buildVisit({ id: 1 }), buildVisit({ id: 2, folio: "VST-100002" })]}
        selectedVisitId={2}
        onSelectVisit={vi.fn()}
      />,
    );

    expect(screen.getByTestId("somato-visit-card-1")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByTestId("somato-visit-card-2")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("dispara onSelectVisit con el id de la visita clickeada", async () => {
    const user = userEvent.setup();
    const onSelectVisit = vi.fn();

    render(
      <SomatometriaQueueCards
        visits={[buildVisit({ id: 1 }), buildVisit({ id: 2, folio: "VST-100002" })]}
        selectedVisitId={1}
        onSelectVisit={onSelectVisit}
      />,
    );

    await user.click(screen.getByTestId("somato-visit-card-2"));

    expect(onSelectVisit).toHaveBeenCalledWith(2);
    expect(onSelectVisit).toHaveBeenCalledTimes(1);
  });

  it("muestra la fecha/hora en que la visita entro a somatometria (enSomatometriaAt)", () => {
    const enSomatometriaAt = "2026-08-26T09:30:00.000Z";
    const expectedFormatted = new Date(enSomatometriaAt).toLocaleString(
      "es-MX",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      },
    );

    render(
      <SomatometriaQueueCards
        visits={[buildVisit({ id: 1, enSomatometriaAt })]}
        selectedVisitId={null}
        onSelectVisit={vi.fn()}
      />,
    );

    const card = screen.getByTestId("somato-visit-card-1");
    expect(card).toHaveTextContent("En somatometría desde:");
    expect(card).toHaveTextContent(expectedFormatted);
  });

  it("muestra un guion cuando enSomatometriaAt todavia no esta disponible", () => {
    render(
      <SomatometriaQueueCards
        visits={[buildVisit({ id: 1, enSomatometriaAt: null })]}
        selectedVisitId={null}
        onSelectVisit={vi.fn()}
      />,
    );

    expect(screen.getByTestId("somato-visit-card-1")).toHaveTextContent(
      "En somatometría desde: —",
    );
  });

  it("muestra indicador de vitales pendientes cuando la visita aun no los tiene", () => {
    render(
      <SomatometriaQueueCards
        visits={[buildVisit({ id: 1, vitals: null })]}
        selectedVisitId={null}
        onSelectVisit={vi.fn()}
      />,
    );

    expect(screen.getByTestId("somato-visit-card-1")).toHaveTextContent(
      "Vitales pendientes",
    );
  });

  it("muestra indicador de vitales capturados cuando la visita ya los tiene", () => {
    render(
      <SomatometriaQueueCards
        visits={[
          buildVisit({
            id: 1,
            vitals: {
              weightKg: 70,
              heightCm: 175,
              temperatureC: 36.5,
              oxygenSaturationPct: 98,
              bmi: 22.86,
              capturedAt: "2026-08-26T09:45:00.000Z",
              reusedFromVisitId: null,
              reusedFrom: null,
            },
          }),
        ]}
        selectedVisitId={null}
        onSelectVisit={vi.fn()}
      />,
    );

    expect(screen.getByTestId("somato-visit-card-1")).toHaveTextContent(
      "Vitales capturados",
    );
  });

  it("renderiza una tarjeta por cada visita de la cola (tiempo real via prop)", () => {
    render(
      <SomatometriaQueueCards
        visits={[
          buildVisit({ id: 1, folio: "VST-100001" }),
          buildVisit({ id: 2, folio: "VST-100002" }),
          buildVisit({ id: 3, folio: "VST-100003" }),
        ]}
        selectedVisitId={null}
        onSelectVisit={vi.fn()}
      />,
    );

    expect(screen.getByTestId("somato-queue-cards").children).toHaveLength(3);
  });

  describe("badge de tiempo relativo (P4c)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-08-26T14:20:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("no muestra badge de tiempo relativo en el primer render (evita falsos 'Nuevo' al abrir la pantalla)", () => {
      render(
        <SomatometriaQueueCards
          visits={[buildVisit({ id: 1, fechaModf: "2026-08-26T14:00:00.000Z" })]}
          selectedVisitId={null}
          onSelectVisit={vi.fn()}
        />,
      );

      expect(
        screen.queryByTestId("somato-visit-card-1-relative-badge"),
      ).not.toBeInTheDocument();
    });

    it("muestra 'Nuevo' cuando una visita recien ingresa a la cola (sin haber estado en el primer render)", () => {
      const { rerender } = render(
        <SomatometriaQueueCards
          visits={[buildVisit({ id: 1, fechaModf: "2026-08-26T14:00:00.000Z" })]}
          selectedVisitId={null}
          onSelectVisit={vi.fn()}
        />,
      );

      rerender(
        <SomatometriaQueueCards
          visits={[
            buildVisit({ id: 1, fechaModf: "2026-08-26T14:00:00.000Z" }),
            buildVisit({
              id: 2,
              folio: "VST-100002",
              fechaModf: "2026-08-26T14:20:00.000Z",
            }),
          ]}
          selectedVisitId={null}
          onSelectVisit={vi.fn()}
        />,
      );

      expect(
        screen.getByTestId("somato-visit-card-2-relative-badge"),
      ).toHaveTextContent("Nuevo");
      expect(
        screen.queryByTestId("somato-visit-card-1-relative-badge"),
      ).not.toBeInTheDocument();
    });

    it("el badge 'Nuevo' envejece a 'Hace 2 min' solo por el intervalo local de 30s, sin request adicional", () => {
      const { rerender } = render(
        <SomatometriaQueueCards
          visits={[buildVisit({ id: 1, fechaModf: "2026-08-26T14:00:00.000Z" })]}
          selectedVisitId={null}
          onSelectVisit={vi.fn()}
        />,
      );

      rerender(
        <SomatometriaQueueCards
          visits={[
            buildVisit({ id: 1, fechaModf: "2026-08-26T14:00:00.000Z" }),
            buildVisit({
              id: 2,
              folio: "VST-100002",
              fechaModf: "2026-08-26T14:20:00.000Z",
            }),
          ]}
          selectedVisitId={null}
          onSelectVisit={vi.fn()}
        />,
      );

      expect(
        screen.getByTestId("somato-visit-card-2-relative-badge"),
      ).toHaveTextContent("Nuevo");

      // Pasan ~2 minutos sin ningun evento de realtime nuevo -- el unico
      // motor de actualizacion es el setInterval(30_000) del hook.
      act(() => {
        vi.advanceTimersByTime(2 * 60 * 1000);
      });

      expect(
        screen.getByTestId("somato-visit-card-2-relative-badge"),
      ).toHaveTextContent("Hace 2 min");
    });
  });
});
