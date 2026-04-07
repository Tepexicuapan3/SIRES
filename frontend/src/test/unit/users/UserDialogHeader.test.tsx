import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/utils";
import { UserDialogHeader } from "@/domains/auth-access/components/admin/rbac/users/UserDialogHeader";

describe("UserDialogHeader", () => {
  it("renders initials when no avatar is provided", () => {
    render(<UserDialogHeader title="Juan Perez" />);

    expect(screen.getByText("JP")).toBeVisible();
    expect(screen.getByText("Juan Perez")).toBeVisible();
  });

  it("renders subtitle and meta content", () => {
    render(
      <UserDialogHeader
        title="Maria Lopez"
        subtitle="mlopez@metro.cdmx.gob.mx"
        status={<span>Activo</span>}
        meta={<span>Creado hoy</span>}
      />,
    );

    expect(screen.getByText("mlopez@metro.cdmx.gob.mx")).toBeVisible();
    expect(screen.getByText("Activo")).toBeVisible();
    expect(screen.getByText("Creado hoy")).toBeVisible();
  });
});
