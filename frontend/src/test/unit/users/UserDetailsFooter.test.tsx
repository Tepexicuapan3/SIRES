import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test/utils";
import { UserDetailsFooter } from "@features/admin/modules/rbac/users/components/UserDetailsFooter";

describe("UserDetailsFooter", () => {
  it("shows clean state when there are no changes", () => {
    render(
      <UserDetailsFooter
        isDirty={false}
        isSaving={false}
        formId="user-details-form"
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
      <UserDetailsFooter
        isDirty
        isSaving={false}
        formId="user-details-form"
        onCancel={onCancel}
      />,
    );

    expect(screen.getByText("Cambios sin guardar")).toBeVisible();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
