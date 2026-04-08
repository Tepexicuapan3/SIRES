import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/utils";
import { AuthCard } from "@/domains/auth-access/components/shared/AuthCard";

describe("AuthCard branding", () => {
  it("shows SISEM branding when no custom icon is provided", () => {
    render(
      <AuthCard title="Acceso" subtitle="Ingresá tus credenciales">
        <div>contenido</div>
      </AuthCard>,
    );

    expect(screen.getByAltText("Logo SISEM")).toBeVisible();
    expect(
      screen.getByText(/Activación de cuenta de usuario\./i),
    ).toBeVisible();
  });

  it("keeps back button interaction behavior unchanged", () => {
    const onBack = vi.fn();

    render(
      <AuthCard title="Acceso" showBackButton onBack={onBack}>
        <div>contenido</div>
      </AuthCard>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Volver al paso anterior" }),
    );

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
