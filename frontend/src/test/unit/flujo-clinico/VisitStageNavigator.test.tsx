import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test/utils";
import { VisitStageNavigator } from "@features/operativo/shared/components/VisitStageNavigator";

describe("VisitStageNavigator", () => {
  it("bloquea navegacion a etapas futuras desde en_espera", () => {
    render(<VisitStageNavigator currentStatus="en_espera" />);

    expect(screen.getByRole("button", { name: "Recepcion" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Somatometria" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Doctor" })).toBeDisabled();
  });

  it("bloquea doctor cuando la visita sigue en somatometria", () => {
    render(<VisitStageNavigator currentStatus="en_somatometria" />);

    expect(screen.getByRole("button", { name: "Recepcion" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Somatometria" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Doctor" })).toBeDisabled();
  });

  it("permite navegar a cualquier etapa cuando la visita esta en consulta", async () => {
    const onStageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <VisitStageNavigator
        currentStatus="en_consulta"
        currentStage="doctor"
        onStageChange={onStageChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Recepcion" }));
    await user.click(screen.getByRole("button", { name: "Somatometria" }));

    expect(onStageChange).toHaveBeenNthCalledWith(1, "recepcion");
    expect(onStageChange).toHaveBeenNthCalledWith(2, "somatometria");
  });
});
