import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/utils";
import { UserCreateDialog } from "@features/admin/modules/rbac/users/components/UserCreateDialog";
import { useCreateUser } from "@features/admin/modules/rbac/users/mutations/useCreateUser";
import { toast } from "sonner";
import type { CentroAtencionListItem, RoleListItem } from "@api/types";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@features/admin/modules/rbac/users/mutations/useCreateUser", () => ({
  useCreateUser: vi.fn(),
}));

vi.mock("@/components/ui/select", async () => {
  const React = await import("react");
  const SelectContext = React.createContext({
    value: "",
    onValueChange: () => {},
  });

  const Select = ({ value, onValueChange, children }) => (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div>{children}</div>
    </SelectContext.Provider>
  );

  const SelectTrigger = ({ children, ...props }) => (
    <button type="button" role="combobox" {...props}>
      {children}
    </button>
  );

  const SelectValue = ({ placeholder }) => <span>{placeholder}</span>;

  const SelectContent = ({ children }) => <div>{children}</div>;

  const SelectItem = ({ value, children }) => {
    const ctx = React.useContext(SelectContext);
    return (
      <button type="button" onClick={() => ctx.onValueChange(value)}>
        {children}
      </button>
    );
  };

  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
  };
});

const createRoleOption = (
  overrides: Partial<RoleListItem> = {},
): RoleListItem => ({
  id: 1,
  name: "Admin",
  description: "Rol admin",
  isActive: true,
  isSystem: false,
  landingRoute: "/admin/panel",
  permissionsCount: 5,
  usersCount: 3,
  ...overrides,
});

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

describe("UserCreateDialog UI", () => {
  const onOpenChange = vi.fn();
  const mutateAsync = vi.fn();

  const roleOptions = [
    createRoleOption({ id: 1, name: "Admin" }),
    createRoleOption({ id: 2, name: "Clinico" }),
  ];
  const clinicOptions = [createClinicOption({ id: 7, name: "Centro Norte" })];

  beforeEach(() => {
    vi.mocked(useCreateUser).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as ReturnType<typeof useCreateUser>);
    mutateAsync.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("shows validation errors on empty submit", async () => {
    const user = userEvent.setup();
    render(
      <UserCreateDialog
        open
        onOpenChange={onOpenChange}
        roleOptions={roleOptions}
        clinicOptions={clinicOptions}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(await screen.findByText("Nombre requerido")).toBeVisible();
    expect(await screen.findByText("Apellido paterno requerido")).toBeVisible();
    expect(await screen.findByText("Usuario requerido")).toBeVisible();
    expect(await screen.findByText("Correo invalido")).toBeVisible();
    expect(
      await screen.findByText("Selecciona un rol", { selector: "p" }),
    ).toBeVisible();
  });

  it("submits and displays generated credentials", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({
      id: 45,
      username: "jperez",
      temporaryPassword: "TempPassword123!",
    });

    render(
      <UserCreateDialog
        open
        onOpenChange={onOpenChange}
        roleOptions={roleOptions}
        clinicOptions={clinicOptions}
      />,
    );

    await user.type(screen.getByLabelText("Nombre"), "Juan");
    await user.type(screen.getByLabelText("Apellido paterno"), "Perez");
    await user.type(screen.getByLabelText("Apellido materno"), "Lopez");
    await user.type(
      screen.getByLabelText("Correo"),
      "jperez@metro.cdmx.gob.mx",
    );
    await user.type(screen.getByLabelText("Usuario"), "jperez");

    await user.click(screen.getByText("Selecciona un centro"));
    await user.click(screen.getByText("Centro Norte"));

    await user.click(screen.getByText("Selecciona un rol"));
    await user.click(screen.getByText("Admin"));

    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        data: {
          username: "jperez",
          firstName: "Juan",
          paternalName: "Perez",
          maternalName: "Lopez",
          email: "jperez@metro.cdmx.gob.mx",
          clinicId: 7,
          primaryRoleId: 1,
        },
      });
    });

    expect(await screen.findByText("Acceso generado")).toBeVisible();
    expect(screen.getByText("jperez")).toBeVisible();
    expect(screen.getByText("TempPassword123!")).toBeVisible();
    expect(toast.success).toHaveBeenCalledWith(
      "Usuario creado",
      expect.objectContaining({
        description: expect.stringContaining("TempPassword123!"),
      }),
    );
  });

  it("copies credentials to clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    mutateAsync.mockResolvedValue({
      id: 88,
      username: "jperez",
      temporaryPassword: "TempPassword123!",
    });

    render(
      <UserCreateDialog
        open
        onOpenChange={onOpenChange}
        roleOptions={roleOptions}
        clinicOptions={clinicOptions}
      />,
    );

    await user.type(screen.getByLabelText("Nombre"), "Juan");
    await user.type(screen.getByLabelText("Apellido paterno"), "Perez");
    await user.type(
      screen.getByLabelText("Correo"),
      "jperez@metro.cdmx.gob.mx",
    );
    await user.type(screen.getByLabelText("Usuario"), "jperez");
    await user.click(screen.getByText("Selecciona un rol"));
    await user.click(screen.getByText("Admin"));
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    await screen.findByText("Acceso generado");
    await user.click(
      screen.getByRole("button", { name: "Copiar credenciales" }),
    );

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "Usuario: jperez\nClave: TempPassword123!",
      );
      expect(toast.success).toHaveBeenCalledWith("Credenciales copiadas");
    });
  });

  it("shows error toast when creation fails", async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValueOnce(new Error("boom"));

    render(
      <UserCreateDialog
        open
        onOpenChange={onOpenChange}
        roleOptions={roleOptions}
        clinicOptions={clinicOptions}
      />,
    );

    await user.type(screen.getByLabelText("Nombre"), "Juan");
    await user.type(screen.getByLabelText("Apellido paterno"), "Perez");
    await user.type(
      screen.getByLabelText("Correo"),
      "jperez@metro.cdmx.gob.mx",
    );
    await user.type(screen.getByLabelText("Usuario"), "jperez");
    await user.click(screen.getByText("Selecciona un rol"));
    await user.click(screen.getByText("Admin"));
    await user.click(screen.getByRole("button", { name: "Crear usuario" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "No se pudo crear el usuario",
        expect.any(Object),
      );
    });
  });
});
