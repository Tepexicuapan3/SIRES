import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { render, screen } from "@/test/utils";
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

const renderGeneralTab = () => {
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
        accountIsActive
        onSubmit={vi.fn()}
        onAccountStatusChange={vi.fn()}
      />
    );
  };

  render(<Wrapper />);
};

describe("UserDetailsGeneralTab", () => {
  it("renders account summary and audit metadata", () => {
    renderGeneralTab();

    expect(screen.getByText("Usuario")).toBeVisible();
    expect(screen.getByText("Rol principal")).toBeVisible();
    expect(screen.getByLabelText("Nombre")).toBeVisible();
    expect(screen.getByLabelText("Correo")).toBeVisible();
    expect(screen.getByText("Centro de atencion")).toBeVisible();
    expect(screen.getByText("Estado de la cuenta")).toBeVisible();
  });

  it("notifies account status change", async () => {
    const onAccountStatusChange = vi.fn();
    const user = userEvent.setup();

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
          accountIsActive
          onSubmit={vi.fn()}
          onAccountStatusChange={onAccountStatusChange}
        />
      );
    };

    render(<Wrapper />);

    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[1]);
    await user.click(screen.getByRole("option", { name: "Inactivo" }));

    expect(onAccountStatusChange).toHaveBeenCalledWith(false);
  });
});
