import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@/test/utils";
import { server } from "@/test/mocks/server";
import { getApiUrl } from "@/test/mocks/urls";
import { ModuleCreateWizard } from "@features/admin/modules/menus/components/ModuleCreateWizard";
import type { CreateModuleRequest, ModuleCatalogNodeDTO } from "@api/types";

/**
 * Test de seguimiento del change `menu-modulos-crud-ui`: `NavIconPicker`
 * (Fase 6) quedo sin conectar al wizard de creacion/edicion (el schema
 * excluia `icon` a proposito). Este test confirma el WIRING end-to-end --
 * el icono elegido en el paso 1 llega intacto al payload de
 * `POST /api/v1/modules` (via `useCreateModule`).
 */

const noop = () => {};

const allNodes: ModuleCatalogNodeDTO[] = [];

describe("ModuleCreateWizard - icono", () => {
  it("el icono elegido en el paso 1 llega al payload de creacion", async () => {
    let capturedBody: CreateModuleRequest | null = null;

    server.use(
      http.post(getApiUrl("modules"), async ({ request }) => {
        capturedBody = (await request.json()) as CreateModuleRequest;
        return HttpResponse.json({ key: "autorizacion-de-estudios", id: 99 });
      }),
    );

    const user = userEvent.setup();
    render(
      <ModuleCreateWizard open onOpenChange={noop} allNodes={allNodes} />,
    );

    // Paso 1: titulo + icono.
    await user.type(
      screen.getByLabelText("Título"),
      "Autorización de Estudios",
    );

    await user.click(screen.getByRole("combobox"));
    const iconPopover = await screen.findByPlaceholderText("Buscar icono...");
    await user.type(iconPopover, "Jeringa");
    await user.click(screen.getByRole("button", { name: "Jeringa" }));

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    // Paso 2: destino.
    await user.click(screen.getByRole("combobox"));
    const destinationPopover = await screen.findByPlaceholderText(
      "Buscar pantalla...",
    );
    await user.type(destinationPopover, "Autorización de Estudios");
    await user.click(await screen.findByText("Autorización de Estudios"));

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    // Paso 3: ubicacion (raiz por default) -> confirmar.
    await user.click(screen.getByRole("button", { name: "Crear" }));

    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
    });
    const body = capturedBody as unknown as CreateModuleRequest;
    expect(body.icon).toBe("syringe");
    expect(body.title).toBe("Autorización de Estudios");
  });
});
