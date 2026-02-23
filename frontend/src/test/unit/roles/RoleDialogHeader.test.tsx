import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/utils";
import { RoleDialogHeader } from "@features/admin/modules/rbac/roles/components/RoleDialogHeader";

describe("RoleDialogHeader", () => {
  it("renders title and subtitle", () => {
    render(
      <RoleDialogHeader
        title="Auditoria"
        subtitle="Rol de auditoria"
        status={<span>Activo</span>}
        meta={<span>Creado hoy</span>}
      />,
    );

    expect(screen.getByText("Auditoria")).toBeVisible();
    expect(screen.getByText("Rol de auditoria")).toBeVisible();
    expect(screen.getByText("Activo")).toBeVisible();
    expect(screen.getByText("Creado hoy")).toBeVisible();
  });
});
