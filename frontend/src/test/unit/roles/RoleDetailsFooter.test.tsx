import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test/utils";
import { RoleDetailsFooter } from "@/domains/auth-access/components/admin/rbac/roles/RoleDetailsFooter";

describe("RoleDetailsFooter", () => {
  it("shows clean state when there are no changes", () => {
    render(
      <RoleDetailsFooter
        isDirty={false}
        isSaving={false}
        formId="role-details-form"
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Sin cambios")).toBeVisible();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("enables save and triggers cancel", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <RoleDetailsFooter
        isDirty
        isSaving={false}
        formId="role-details-form"
        onCancel={onCancel}
      />,
    );

    expect(screen.getByText("Cambios sin guardar")).toBeVisible();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
