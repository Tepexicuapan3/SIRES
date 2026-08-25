import { beforeEach, describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor, within } from "@/test/utils";
import { server } from "@/test/mocks/server";
import { getApiUrl } from "@/test/mocks/urls";
import { setMockSessionUser } from "@/test/mocks/session";
import { createMockAuthUser } from "@/test/factories/users";
import { MenusPage } from "@features/admin/modules/menus/pages/MenusPage";
import type {
  ModuleCatalogNodeDTO,
  SetModuleVisibilityRequest,
  UpdateModuleRequest,
} from "@api/types";
import type { NavigationMenuResponse } from "@api/types/navigation.types";

/**
 * Tests de integracion de Fase 8 (gap real, no cubierto por
 * `ModuleCreateWizard.ui.test.tsx` -- ese test solo monta el wizard
 * aislado en modo CREACION -- ni por los tests unitarios de Fase 5/6/7):
 * `MenusPage` NUNCA se habia montado en un test. Se prueban los dos flujos
 * de escritura que solo existen a traves de la pagina real: ocultar un
 * modulo (`HideModuleDialog` -> `useHideModule` -> `PATCH .../visibility`)
 * y editar uno existente (wizard en modo edicion -> `useUpdateModule` ->
 * `PATCH /modules/{clave}`, nunca ejercitado, solo el modo creacion).
 *
 * Gotcha: `RolePreviewPanel` (Fase 7) vive SIEMPRE montado dentro de
 * `MenusPage` y su `Select` de rol tambien resuelve a
 * `role="combobox"` -- mismo rol que usa `NavIconPicker`/
 * `MenuDestinationSelect` dentro del wizard. Para no ambiguar
 * `getByRole("combobox")` se deja `admin.roles.read` SIN otorgar (el panel
 * cae al aviso de solo-lectura, sin renderizar su combobox) y toda query
 * dentro del dialogo se escopea con `within(dialog)`.
 */

const grantedCapability = () => ({
  granted: true,
  missingAllOf: [] as string[],
  missingAnyOf: [] as string[],
});

const seedSession = () => {
  setMockSessionUser(
    createMockAuthUser({
      username: "menus_page_tester",
      permissions: ["*"],
      capabilities: {
        "admin.menus.read": grantedCapability(),
        "admin.menus.create": grantedCapability(),
        "admin.menus.update": grantedCapability(),
        "admin.menus.delete": grantedCapability(),
      },
    }),
  );
};

const buildCatalog = (): ModuleCatalogNodeDTO[] => [
  {
    id: 501,
    key: "farmacia",
    title: "Farmacia",
    icon: "pill",
    url: null,
    orden: 10,
    group: "primary",
    isSection: true,
    isSystem: false,
    isActive: true,
    parentKey: null,
    permissions: [],
    items: [
      {
        id: 502,
        key: "farmacia.recetas",
        title: "Recetas",
        icon: "pill",
        url: "/farmacia/recetas",
        orden: 10,
        group: "primary",
        isSection: false,
        isSystem: false,
        isActive: true,
        parentKey: "farmacia",
        permissions: ["farmacia:recetas:read"],
        items: [],
      },
    ],
  },
];

const mockCatalog = () => {
  server.use(
    http.get(getApiUrl("modules"), () => {
      return HttpResponse.json({ modules: buildCatalog() });
    }),
  );
};

const mockNavigationMenu = () => {
  server.use(
    http.get(getApiUrl("navigation-menu"), () => {
      const response: NavigationMenuResponse = {
        source: "static",
        sections: [],
        secondaryItems: [],
      };
      return HttpResponse.json(response);
    }),
  );
};

describe("MenusPage integration (MSW)", () => {
  beforeEach(() => {
    seedSession();
    mockCatalog();
    mockNavigationMenu();
  });

  it("carga el catalogo y oculta un modulo no-sistema confirmando en el dialogo", async () => {
    let capturedBody: SetModuleVisibilityRequest | null = null;
    server.use(
      http.patch(getApiUrl("modules/farmacia.recetas/visibility"), async ({ request }) => {
        capturedBody = (await request.json()) as SetModuleVisibilityRequest;
        return HttpResponse.json({
          module: {
            key: "farmacia.recetas",
            title: "Recetas",
            icon: "pill",
            url: "/farmacia/recetas",
            orden: 10,
            group: "primary",
            isSection: false,
            isSystem: false,
            isActive: false,
            parentKey: "farmacia",
            permissions: ["farmacia:recetas:read"],
          },
        });
      }),
    );

    const user = userEvent.setup();
    render(<MenusPage />);

    await screen.findByText("Farmacia");
    await user.click(screen.getByRole("button", { name: "Expandir Farmacia" }));
    await screen.findByText("Recetas");

    await user.click(
      screen.getByRole("button", {
        name: "Ver información y acciones de Recetas",
      }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: /ocultar del menú/i }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("Ocultar módulo del menú"),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Ocultar" }));

    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
    });
    expect((capturedBody as unknown as SetModuleVisibilityRequest).isActive).toBe(
      false,
    );
  });

  it("edita un modulo existente via el wizard en modo edicion (PATCH /modules/{clave})", async () => {
    let capturedBody: UpdateModuleRequest | null = null;
    server.use(
      http.patch(getApiUrl("modules/farmacia.recetas"), async ({ request }) => {
        capturedBody = (await request.json()) as UpdateModuleRequest;
        return HttpResponse.json({
          module: {
            key: "farmacia.recetas",
            title: capturedBody?.title ?? "Recetas",
            icon: "pill",
            url: "/farmacia/recetas",
            orden: 10,
            group: "primary",
            isSection: false,
            isSystem: false,
            isActive: true,
            parentKey: "farmacia",
            permissions: ["farmacia:recetas:read"],
          },
        });
      }),
    );

    const user = userEvent.setup();
    render(<MenusPage />);

    await screen.findByText("Farmacia");
    await user.click(screen.getByRole("button", { name: "Expandir Farmacia" }));
    await screen.findByText("Recetas");

    await user.click(
      screen.getByRole("button", {
        name: "Ver información y acciones de Recetas",
      }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: /^editar$/i }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("Editar elemento del menú"),
    ).toBeInTheDocument();

    const titleInput = within(dialog).getByLabelText("Nombre");
    await user.clear(titleInput);
    await user.type(titleInput, "Recetas actualizado");

    // Paso 1 -> Paso 2 (destino, ya prellenado desde el nodo editado).
    await user.click(within(dialog).getByRole("button", { name: "Siguiente" }));

    // Ultimo paso en modo edicion: el boton pasa a "Guardar" y dispara el PATCH.
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
    });
    expect((capturedBody as unknown as UpdateModuleRequest).title).toBe(
      "Recetas actualizado",
    );
  });
});
