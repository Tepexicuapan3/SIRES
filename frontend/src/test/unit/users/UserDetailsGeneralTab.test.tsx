import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { render, screen, within } from "@/test/utils";
import { UserDetailsGeneralTab } from "@features/admin/modules/rbac/users/components/UserDetailsGeneralTab";
import { createMockUserDetail } from "@/test/factories/users";
import type { UserDetailsFormValues } from "@features/admin/modules/rbac/users/domain/users.schemas";
import type { CentroAtencionListItem } from "@api/types";

const createClinicOption = (
  overrides: Partial<CentroAtencionListItem> = {},
): CentroAtencionListItem => ({
  id: 1,
  name: "Centro 1",
  folioCode: "CEN-001",
  isExternal: false,
  isActive: true,
  ...overrides,
});

const renderGeneralTab = ({
  onStatusChange,
}: {
  onStatusChange?: (nextActive: boolean) => void;
} = {}) => {
  const userDetail = createMockUserDetail({
    id: 17,
    username: "jperez",
    primaryRole: "Clinico",
    isActive: true,
  });
  const clinicOptions = [createClinicOption({ id: 1, name: "Centro 1" })];

  const Wrapper = () => {
    const form = useForm<UserDetailsFormValues>({
      defaultValues: {
        firstName: userDetail.firstName,
        paternalName: userDetail.paternalName,
        maternalName: userDetail.maternalName,
        email: userDetail.email,
        clinicId: userDetail.clinic?.id ?? null,
      },
    });

    return (
      <UserDetailsGeneralTab
        form={form}
        formId="user-details-form"
        clinicOptions={clinicOptions}
        userDetail={userDetail}
        onSubmit={vi.fn()}
        onStatusChange={onStatusChange}
        lastLoginLabel="hoy"
        lastIpLabel="127.0.0.1"
      />
    );
  };

  render(<Wrapper />);
};

describe("UserDetailsGeneralTab", () => {
  it("renders readonly fields and metadata", () => {
    renderGeneralTab();

    expect(screen.getByDisplayValue("jperez")).toBeDisabled();
    expect(screen.getByDisplayValue("Clinico")).toBeDisabled();
    expect(screen.getByText("Ultimo acceso: hoy")).toBeVisible();
    expect(screen.getByText("Ultima IP: 127.0.0.1")).toBeVisible();
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
