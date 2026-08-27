import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test/utils";
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
  createdById: null,
  vitals: null,
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
});
