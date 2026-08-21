import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent, {
  PointerEventsCheckLevel,
} from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@/test/utils";
import { server } from "@/test/mocks/server";
import { getApiUrl } from "@/test/mocks/urls";
import { setMockSessionUser } from "@/test/mocks/session";
import { createMockAuthUser } from "@/test/factories/users";
import {
  createMockRoleDetail,
  createMockRoleListItem,
  createMockRolePermission,
} from "@/test/factories/roles";
import { RoleDetailsDialog } from "@/domains/auth-access/components/admin/rbac/roles/RoleDetailsDialog";
import { toast } from "sonner";
import type { ModuleCatalogNodeDTO } from "@api/types/navigation.types";
import type { Permission } from "@api/types/permissions.types";
import type { RoleDetail, RolePermission } from "@api/types/roles.types";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

/**
 * Tests de integracion de la tab "Modulos" del detalle de rol (Fase 6).
 *
 * A diferencia de `RoleDetailsDialog.ui.test.tsx` (que mockea los hooks de
 * React Query directamente), estos tests montan `RoleDetailsDialog` con los
 * hooks REALES (`useRoleDetail`, `usePermissionsCatalog`, `useModuleCatalog`,
 * `useAssignRolePermissions`, `useAuthSession`) y los ejercitan contra MSW,
 * mockeando `GET /api/v1/modules` y `POST /permissions/assign` por test via
 * `server.use(...)`. Solo se mockea `sonner` (no hay `Toaster` montado en
 * `TestProviders`), igual que el resto de la suite de roles.
 */

const MODULE_PERMISSION_CODE = "clinico:consultas:read";
const STANDALONE_PERMISSION_CODE = "clinico:reportes:export";
const EXISTING_PERMISSION_CODE = "admin:reportes:read";

const PERMISSIONS_CATALOG: Permission[] = [
  {
    id: 501,
    code: MODULE_PERMISSION_CODE,
    description: "Ver consultas",
    isSystem: true,
  },
  {
    id: 502,
    code: STANDALONE_PERMISSION_CODE,
    description: "Exportar reportes",
    isSystem: true,
  },
  {
    id: 601,
    code: EXISTING_PERMISSION_CODE,
    description: "Ver reportes",
    isSystem: true,
  },
];

const buildModuleTree = (): ModuleCatalogNodeDTO[] => [
  {
    key: "clinico.consultas.panel",
    title: "Panel de Consultas",
    icon: "activity",
    url: "/clinico/consultas",
    group: "primary",
    isSection: false,
    permissions: [MODULE_PERMISSION_CODE],
    items: [],
  },
  {
    key: "clinico.consultas.detalle",
    title: "Detalle de Consulta",
    icon: "activity",
    url: "/clinico/consultas/detalle",
    group: "primary",
    isSection: false,
    permissions: [MODULE_PERMISSION_CODE],
    items: [],
  },
  {
    key: "clinico.dashboard.widget",
    title: "Widget de Consultas",
    icon: "activity",
    url: null,
    group: "primary",
    isSection: false,
    permissions: [MODULE_PERMISSION_CODE],
    items: [],
  },
  {
    key: "reportes.consultas",
    title: "Reporte de Consultas",
    icon: "activity",
    url: "/reportes/consultas",
    group: "primary",
    isSection: false,
    permissions: [MODULE_PERMISSION_CODE],
    items: [],
  },
  {
    key: "clinico.reportes.export",
    title: "Exportar Reportes",
    icon: "activity",
    url: "/clinico/reportes/export",
    group: "primary",
    isSection: false,
    permissions: [STANDALONE_PERMISSION_CODE],
    items: [],
  },
];

const mockModuleCatalog = () => {
  server.use(
    http.get(getApiUrl("modules"), () => {
      return HttpResponse.json({ modules: buildModuleTree() });
    }),
  );
};

const mockPermissionsCatalog = () => {
  server.use(
    http.get(getApiUrl("permissions"), () => {
      return HttpResponse.json({
        items: PERMISSIONS_CATALOG,
        total: PERMISSIONS_CATALOG.length,
      });
    }),
  );
};

const permissionToRolePermission = (permission: Permission): RolePermission =>
  createMockRolePermission({
    id: permission.id,
    code: permission.code,
    description: permission.description,
  });

const onOpenChange = vi.fn();
const onClose = vi.fn();

/**
 * `useAuthSession` (GET /auth/me) resuelve en paralelo con `useModuleCatalog`
 * (GET /modules) -- el checkbox de un nodo queda disabled hasta que
 * `actorPermissions` carga (preflight `canManage` en `RoleDetailsModulesTab`).
 * Si se clickea el checkbox apenas aparece (antes de que la sesion resuelva)
 * el click es un no-op silencioso. Se espera explicitamente a que quede
 * habilitado antes de clickearlo.
 */
const findEnabledCheckbox = async (name: string) => {
  await waitFor(() => {
    expect(screen.getByRole("checkbox", { name })).toBeEnabled();
  });
  return screen.getByRole("checkbox", { name });
};

describe("RoleDetailsModulesTab integration (MSW)", () => {
  beforeEach(() => {
    onOpenChange.mockClear();
    onClose.mockClear();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    mockModuleCatalog();
    mockPermissionsCatalog();
    setMockSessionUser(createMockAuthUser({ permissions: ["*"] }));
  });

  it("collateral impact dialog: cancel keeps draft untouched, confirm + Guardar sends ONE bulk assign with the full set", async () => {
    const roleDetail: RoleDetail = createMockRoleDetail({
      id: 50,
      name: "Clinico Editor",
      description: "Edita configuracion clinica",
      isSystem: false,
      isActive: true,
    });
    const roleSummary = createMockRoleListItem({
      id: 50,
      name: "Clinico Editor",
      isSystem: false,
      isActive: true,
    });
    const existingPermission = permissionToRolePermission(
      PERMISSIONS_CATALOG[2],
    );

    let currentPermissions: RolePermission[] = [existingPermission];
    const capturedAssignBodies: Array<{
      roleId: number;
      permissionIds: number[];
    }> = [];

    server.use(
      http.get(getApiUrl("roles/:id"), () => {
        return HttpResponse.json({
          role: roleDetail,
          permissions: currentPermissions,
        });
      }),
      http.post(getApiUrl("permissions/assign"), async ({ request }) => {
        const body = (await request.json()) as {
          roleId: number;
          permissionIds: number[];
        };
        capturedAssignBodies.push(body);
        currentPermissions = PERMISSIONS_CATALOG.filter((permission) =>
          body.permissionIds.includes(permission.id),
        ).map(permissionToRolePermission);

        return HttpResponse.json({
          roleId: body.roleId,
          permissions: currentPermissions,
        });
      }),
    );

    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    render(
      <RoleDetailsDialog
        open
        onOpenChange={onOpenChange}
        onClose={onClose}
        roleSummary={roleSummary}
        canEdit
      />,
    );

    await user.click(await screen.findByRole("tab", { name: /Modulos/i }));

    const panelCheckboxName = "Agregar modulo Panel de Consultas";
    await user.click(await findEnabledCheckbox(panelCheckboxName));

    expect(
      screen.getByRole("heading", { name: /Efecto colateral en/ }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Este cambio también hará visibles: Detalle de Consulta, Widget de Consultas, Reporte de Consultas. ¿Confirmás el cambio?",
      ),
    ).toBeVisible();

    // Cancelar: el dialogo cierra sin mutar el draft (checkbox sigue sin tildar).
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(
      screen.queryByRole("heading", { name: /Efecto colateral en/ }),
    ).toBeNull();
    expect(
      screen.getByRole("checkbox", { name: panelCheckboxName }),
    ).not.toBeChecked();
    expect(capturedAssignBodies).toHaveLength(0);

    // Tildar de nuevo y esta vez confirmar el efecto colateral.
    await user.click(await findEnabledCheckbox(panelCheckboxName));
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(
      screen.getByRole("checkbox", { name: "Quitar modulo Panel de Consultas" }),
    ).toBeChecked();
    // Confirmar solo muta el draft local -- no dispara red hasta "Guardar".
    expect(capturedAssignBodies).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(capturedAssignBodies).toHaveLength(1);
    });
    expect(capturedAssignBodies[0]).toEqual({
      roleId: 50,
      permissionIds: expect.arrayContaining([601, 501]),
    });
    expect(capturedAssignBodies[0].permissionIds).toHaveLength(2);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Cambios guardados",
        expect.any(Object),
      );
    });
  });

  it("system role: Modulos tab renders read-only with every checkbox disabled regardless of assigned permissions", async () => {
    const roleDetail: RoleDetail = createMockRoleDetail({
      id: 1,
      name: "Admin",
      description: "Rol de sistema",
      isSystem: true,
      isActive: true,
    });
    const roleSummary = createMockRoleListItem({
      id: 1,
      name: "Admin",
      isSystem: true,
      isActive: true,
    });
    const assignedPermission = permissionToRolePermission(
      PERMISSIONS_CATALOG[0],
    );

    server.use(
      http.get(getApiUrl("roles/:id"), () => {
        return HttpResponse.json({
          role: roleDetail,
          permissions: [assignedPermission],
        });
      }),
    );

    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    render(
      <RoleDetailsDialog
        open
        onOpenChange={onOpenChange}
        onClose={onClose}
        roleSummary={roleSummary}
        canEdit
      />,
    );

    await user.click(await screen.findByRole("tab", { name: /Modulos/i }));

    expect(
      screen.getByText(
        "Solo lectura: no puedes actualizar este rol porque es de sistema o no tienes permisos.",
      ),
    ).toBeVisible();

    const checkboxes = await screen.findAllByRole("checkbox");
    expect(checkboxes).toHaveLength(5);
    for (const checkbox of checkboxes) {
      expect(checkbox).toBeDisabled();
    }

    // Los nodos que comparten el permiso asignado se ven tildados pero
    // siguen disabled -- el estado real de permisos no habilita nada.
    expect(
      screen.getByRole("checkbox", { name: "Quitar modulo Panel de Consultas" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("checkbox", {
        name: "Quitar modulo Detalle de Consulta",
      }),
    ).toBeDisabled();
    // El nodo sin ese permiso queda destildado, tambien disabled.
    expect(
      screen.getByRole("checkbox", {
        name: "Agregar modulo Exportar Reportes",
      }),
    ).toBeDisabled();
  });

  it("admin role: Modulos tab renders every managed node checked and disabled with the admin legend, regardless of RelRolPermiso", async () => {
    const roleDetail: RoleDetail = createMockRoleDetail({
      id: 2,
      name: "admin",
      description: "Administrador del dominio Auth-Access",
      isSystem: false,
      isAdmin: true,
      isActive: true,
    });
    const roleSummary = createMockRoleListItem({
      id: 2,
      name: "admin",
      isSystem: false,
      isAdmin: true,
      isActive: true,
    });

    server.use(
      http.get(getApiUrl("roles/:id"), () => {
        // RelRolPermiso practicamente vacio -- asi es en produccion para el
        // rol admin, porque el RBACResolver le da acceso via wildcard
        // dinamico, no via estas filas.
        return HttpResponse.json({ role: roleDetail, permissions: [] });
      }),
    );

    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    render(
      <RoleDetailsDialog
        open
        onOpenChange={onOpenChange}
        onClose={onClose}
        roleSummary={roleSummary}
        canEdit
      />,
    );

    await user.click(await screen.findByRole("tab", { name: /Modulos/i }));

    expect(
      screen.getByText(
        "Este rol tiene acceso total automatico a todos los permisos y modulos -- no depende de asignaciones individuales.",
      ),
    ).toBeVisible();

    const checkboxes = await screen.findAllByRole("checkbox");
    expect(checkboxes).toHaveLength(5);
    for (const checkbox of checkboxes) {
      expect(checkbox).toBeDisabled();
    }

    // Todos los nodos administrables (con permisos propios) se ven tildados,
    // aunque RelRolPermiso este vacio -- el resolver le da acceso total.
    expect(
      screen.getByRole("checkbox", { name: "Quitar modulo Panel de Consultas" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", {
        name: "Quitar modulo Exportar Reportes",
      }),
    ).toBeChecked();
  });

  it("PERMISSION_GRANT_NOT_ALLOWED: shows the mapped message instead of a generic error and resyncs the checkbox", async () => {
    const roleDetail: RoleDetail = createMockRoleDetail({
      id: 60,
      name: "Auditoria QA",
      description: "Rol de auditoria",
      isSystem: false,
      isActive: true,
    });
    const roleSummary = createMockRoleListItem({
      id: 60,
      name: "Auditoria QA",
      isSystem: false,
      isActive: true,
    });

    server.use(
      http.get(getApiUrl("roles/:id"), () => {
        return HttpResponse.json({ role: roleDetail, permissions: [] });
      }),
      http.post(getApiUrl("permissions/assign"), () => {
        return HttpResponse.json(
          {
            code: "PERMISSION_GRANT_NOT_ALLOWED",
            message: "No puedes asignar permisos que no tienes.",
          },
          { status: 403 },
        );
      }),
    );

    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    render(
      <RoleDetailsDialog
        open
        onOpenChange={onOpenChange}
        onClose={onClose}
        roleSummary={roleSummary}
        canEdit
      />,
    );

    await user.click(await screen.findByRole("tab", { name: /Modulos/i }));

    const exportCheckboxName = "Agregar modulo Exportar Reportes";
    await user.click(await findEnabledCheckbox(exportCheckboxName));
    // Codigo unico, sin colaterales: se aplica directo al draft sin dialogo.
    expect(
      screen.getByRole("checkbox", { name: "Quitar modulo Exportar Reportes" }),
    ).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "No se pudieron guardar todos los cambios",
        expect.objectContaining({
          description: "No puedes asignar permisos que no tienes.",
        }),
      );
    });

    // Nunca se aplico un mensaje generico.
    expect(toast.error).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        description: "No se pudieron guardar los cambios del rol.",
      }),
    );

    // El refetch tras el error resincroniza el draft con el servidor (permisos
    // vacios) -- el checkbox vuelve a su estado real, sin el cambio fallido.
    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", { name: exportCheckboxName }),
      ).not.toBeChecked();
    });
  });
});
