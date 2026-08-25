import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test/utils";
import { SidebarProvider } from "@shared/ui/sidebar";
import { NavMain } from "@shared/layouts/sidebar/NavMain";
import type { NavSection } from "@app/navigation/nav-config";

/**
 * Guarda de regresion: el buscador de "carpeta grande" (>8 items) al
 * principio solo existia para SECCIONES RAIZ (ver NavMain.tsx). Cuando
 * "Catalogos" paso a vivir ANIDADO dentro de "Administracion" (a pedido
 * del usuario), el buscador desaparecio -- `NavRecursiveItem` (que
 * renderiza cualquier carpeta que no sea de nivel raiz) no tenia esa
 * logica. Este test cubre que una carpeta grande anidada a cualquier
 * profundidad tambien saca su propio buscador.
 */
const buildManyItems = (count: number, prefix: string) =>
  Array.from({ length: count }, (_, index) => ({
    title: `${prefix} ${index + 1}`,
    url: `/${prefix.toLowerCase()}-${index + 1}`,
  }));

describe("NavMain - buscador en carpeta anidada grande", () => {
  it("muestra buscador y filtra una carpeta con mas de 8 items aunque no sea seccion raiz", async () => {
    const user = userEvent.setup();

    const sections: NavSection[] = [
      {
        title: "Administracion",
        items: [
          {
            title: "Catalogos",
            items: buildManyItems(10, "Catalogo"),
          },
        ],
      },
    ];

    render(
      <SidebarProvider>
        <NavMain sections={sections} />
      </SidebarProvider>,
    );

    // "Administracion" tiene un solo item (Catalogos) -> se renderiza
    // siempre expandida (no supera el umbral), pero "Catalogos" (10
    // items) arranca colapsada: hay que abrirla para ver el buscador.
    await user.click(screen.getByRole("button", { name: /catalogos/i }));

    const searchInput = await screen.findByPlaceholderText("Buscar en catalogos");
    expect(searchInput).toBeVisible();

    expect(screen.getByText("Catalogo 1")).toBeVisible();
    expect(screen.getByText("Catalogo 10")).toBeVisible();

    await user.type(searchInput, "Catalogo 5");

    expect(screen.getByText("Catalogo 5")).toBeVisible();
    expect(screen.queryByText("Catalogo 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Catalogo 10")).not.toBeInTheDocument();
  });
});
