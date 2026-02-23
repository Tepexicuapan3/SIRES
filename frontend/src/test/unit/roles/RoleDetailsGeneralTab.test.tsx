import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { render, screen, within } from "@/test/utils";
import { RoleDetailsGeneralTab } from "@features/admin/modules/rbac/roles/components/RoleDetailsGeneralTab";
import { createMockRoleDetail } from "@/test/factories/roles";
import type { RoleDetailsFormValues } from "@features/admin/modules/rbac/roles/domain/roles.schemas";

const renderGeneralTab = ({
  onStatusChange,
}: {
  onStatusChange?: (nextActive: boolean) => void;
} = {}) => {
  const roleDetail = createMockRoleDetail({
    id: 17,
    name: "Auditoria",
    description: "Rol auditoria",
    isActive: true,
    isSystem: false,
    permissionsCount: 3,
    usersCount: 1,
  });

  const Wrapper = () => {
    const form = useForm<RoleDetailsFormValues>({
      defaultValues: {
        name: roleDetail.name,
        description: roleDetail.description,
        landingRoute: roleDetail.landingRoute ?? "",
      },
    });

    return (
      <RoleDetailsGeneralTab
        form={form}
        formId="role-details-form"
        roleDetail={roleDetail}
        onSubmit={vi.fn()}
        activeStatus={roleDetail.isActive}
        onStatusChange={onStatusChange}
      />
    );
  };

  render(<Wrapper />);
};

describe("RoleDetailsGeneralTab", () => {
  it("renders readonly metadata fields", () => {
    renderGeneralTab();

    expect(screen.getByDisplayValue("Custom")).toBeDisabled();
    expect(screen.getByRole("combobox")).toHaveTextContent("Activo");
  });

  it("notifies status change", async () => {
    const onStatusChange = vi.fn();
    const user = userEvent.setup();
    renderGeneralTab({ onStatusChange });

    const statusContainer = screen.getByText("Estado").closest("div");
    expect(statusContainer).not.toBeNull();
    const statusSelect = (statusContainer as HTMLElement).querySelector(
      "[data-slot='select-trigger']",
    );
    expect(statusSelect).not.toBeNull();

    await user.click(statusSelect as HTMLElement);
    const listbox = screen.getByRole("listbox");
    await user.click(within(listbox).getByText("Inactivo"));

    expect(onStatusChange).toHaveBeenCalledWith(false);
  });
});
