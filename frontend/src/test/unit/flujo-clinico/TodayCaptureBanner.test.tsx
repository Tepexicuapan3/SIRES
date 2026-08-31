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
  // El formulario de captura (SomatometriaCapturePage.tsx) ya arranca
  // precargado con los valores de hoy por default -- este banner solo
  // informa de donde salen esos valores y ofrece el atajo de un solo click
  // a consulta. Ya no hay decision "pending/reused/fresh" ni botones de
  // Reusar/Capturar nuevos.

  it("muestra folio, servicio y momento de captura de la visita origen", () => {
    render(
      <TodayCaptureBanner
        todayCapture={buildTodayCapture({
          sourceFolio: "VST-000777",
          sourceServiceType: "urgencias",
        })}
        onPasarDirectoAConsulta={vi.fn()}
      />,
    );

    const banner = screen.getByTestId("today-capture-banner");
    expect(banner).toHaveTextContent("VST-000777");
    expect(banner).toHaveTextContent("Urgencias");
  });

  it("muestra los valores de la captura de hoy", () => {
    render(
      <TodayCaptureBanner
        todayCapture={buildTodayCapture()}
        onPasarDirectoAConsulta={vi.fn()}
      />,
    );

    const values = screen.getByTestId("today-capture-values");
    expect(values).toHaveTextContent("72.5 kg");
    expect(values).toHaveTextContent("168 cm");
    expect(values).toHaveTextContent("25.69");
    expect(values).toHaveTextContent("36.6 °C");
    expect(values).toHaveTextContent("97%");
    expect(values).toHaveTextContent("118/76");
    expect(values).toHaveTextContent("78 lpm");
    expect(values).toHaveTextContent("16 rpm");
    expect(values).toHaveTextContent("94 mg/dL");
    expect(values).toHaveTextContent("88 cm");
  });

  it("dispara 'Pasar directo a consulta' con un click explicito", async () => {
    const user = userEvent.setup();
    const onPasarDirectoAConsulta = vi.fn();

    render(
      <TodayCaptureBanner
        todayCapture={buildTodayCapture()}
        onPasarDirectoAConsulta={onPasarDirectoAConsulta}
      />,
    );

    const button = screen.getByTestId("today-capture-direct-button");
    expect(button).toBeVisible();

    await user.click(button);

    expect(onPasarDirectoAConsulta).toHaveBeenCalledTimes(1);
  });

  it("deshabilita el boton cuando `disabled` es true", () => {
    render(
      <TodayCaptureBanner
        todayCapture={buildTodayCapture()}
        onPasarDirectoAConsulta={vi.fn()}
        disabled
      />,
    );

    expect(screen.getByTestId("today-capture-direct-button")).toBeDisabled();
  });
});
