import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test/utils";
import { TodayCaptureBanner } from "@features/somatometria/modules/captura/components/TodayCaptureBanner";
import type { TodayCapturePayload } from "@api/types";

const buildTodayCapture = (
  overrides: Partial<TodayCapturePayload> = {},
): TodayCapturePayload => ({
  sourceVisitId: 555,
  sourceFolio: "VST-000555",
  sourceServiceType: "medicina_general",
  capturedAt: "2026-08-26T15:14:22.000Z",
  values: {
    weightKg: 72.5,
    heightCm: 168,
    temperatureC: 36.6,
    oxygenSaturationPct: 97,
    heartRateBpm: 78,
    respiratoryRateBpm: 16,
    bloodPressureSystolic: 118,
    bloodPressureDiastolic: 76,
    waistCircumferenceCm: 88,
    glucosaCapilarMgdl: 94,
    bmi: 25.69,
  },
  ...overrides,
});

describe("TodayCaptureBanner", () => {
  it("con decision 'pending' no dispara ninguna accion automaticamente", () => {
    const onReuse = vi.fn();
    const onCaptureFresh = vi.fn();

    render(
      <TodayCaptureBanner
        todayCapture={buildTodayCapture()}
        decision="pending"
        onReuse={onReuse}
        onCaptureFresh={onCaptureFresh}
      />,
    );

    expect(screen.getByTestId("today-capture-banner")).toBeVisible();
    expect(screen.getByTestId("today-capture-reuse-button")).toBeVisible();
    expect(screen.getByTestId("today-capture-fresh-button")).toBeVisible();
    expect(onReuse).not.toHaveBeenCalled();
    expect(onCaptureFresh).not.toHaveBeenCalled();

    // Sin decision no debe mostrarse ninguna etiqueta de estado.
    expect(
      screen.queryByTestId("today-capture-decision-label"),
    ).not.toBeInTheDocument();
  });

  it("muestra folio, servicio y momento de captura de la visita origen", () => {
    render(
      <TodayCaptureBanner
        todayCapture={buildTodayCapture({
          sourceFolio: "VST-000777",
          sourceServiceType: "urgencias",
        })}
        decision="pending"
        onReuse={vi.fn()}
        onCaptureFresh={vi.fn()}
      />,
    );

    const banner = screen.getByTestId("today-capture-banner");
    expect(banner).toHaveTextContent("VST-000777");
    expect(banner).toHaveTextContent("Urgencias");
  });

  it("requiere un click explicito y distinto para reusar", async () => {
    const user = userEvent.setup();
    const onReuse = vi.fn();
    const onCaptureFresh = vi.fn();

    render(
      <TodayCaptureBanner
        todayCapture={buildTodayCapture()}
        decision="pending"
        onReuse={onReuse}
        onCaptureFresh={onCaptureFresh}
      />,
    );

    await user.click(screen.getByTestId("today-capture-reuse-button"));

    expect(onReuse).toHaveBeenCalledTimes(1);
    expect(onCaptureFresh).not.toHaveBeenCalled();
  });

  it("requiere un click explicito y distinto para capturar de cero", async () => {
    const user = userEvent.setup();
    const onReuse = vi.fn();
    const onCaptureFresh = vi.fn();

    render(
      <TodayCaptureBanner
        todayCapture={buildTodayCapture()}
        decision="pending"
        onReuse={onReuse}
        onCaptureFresh={onCaptureFresh}
      />,
    );

    await user.click(screen.getByTestId("today-capture-fresh-button"));

    expect(onCaptureFresh).toHaveBeenCalledTimes(1);
    expect(onReuse).not.toHaveBeenCalled();
  });

  it("tras decidir 'reused' oculta los botones y confirma que los valores quedan editables", () => {
    render(
      <TodayCaptureBanner
        todayCapture={buildTodayCapture()}
        decision="reused"
        onReuse={vi.fn()}
        onCaptureFresh={vi.fn()}
      />,
    );

    expect(
      screen.queryByTestId("today-capture-reuse-button"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("today-capture-fresh-button"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("today-capture-decision-label")).toHaveTextContent(
      /Revisalos antes de guardar/i,
    );
  });

  it("tras decidir 'fresh' muestra el estado de captura nueva", () => {
    render(
      <TodayCaptureBanner
        todayCapture={buildTodayCapture()}
        decision="fresh"
        onReuse={vi.fn()}
        onCaptureFresh={vi.fn()}
      />,
    );

    expect(screen.getByTestId("today-capture-decision-label")).toHaveTextContent(
      /Capturando signos vitales nuevos/i,
    );
  });

  it("deshabilita ambos botones cuando `disabled` es true", () => {
    render(
      <TodayCaptureBanner
        todayCapture={buildTodayCapture()}
        decision="pending"
        onReuse={vi.fn()}
        onCaptureFresh={vi.fn()}
        disabled
      />,
    );

    expect(screen.getByTestId("today-capture-reuse-button")).toBeDisabled();
    expect(screen.getByTestId("today-capture-fresh-button")).toBeDisabled();
  });
});
