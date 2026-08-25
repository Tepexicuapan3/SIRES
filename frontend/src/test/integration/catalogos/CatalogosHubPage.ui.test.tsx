import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { render, screen } from "@/test/utils";
import { server } from "@/test/mocks/server";
import { getApiUrl } from "@/test/mocks/urls";
import { setMockSessionUser } from "@/test/mocks/session";
import { createMockAuthUser } from "@/test/factories/users";
import CatalogosHubPage from "@features/admin/modules/catalogos/pages/CatalogosHubPage";

/**
 * Guarda de regresion: existen DOS nodos llamados "Catalogos" en el arbol
 * de navegacion -- uno con los catalogos de datos administrativos (Areas,
 * Bajas, etc.), hijo de "Administracion", y otro completamente distinto
 * (Insumos, Proveedores, etc.) hijo de "Almacen". El hub debe mostrar
 * SIEMPRE el de Administracion, nunca el de Almacen, sin importar el
 * orden en que aparezcan las secciones en la respuesta del backend.
 */
describe("CatalogosHubPage", () => {
  it("muestra los catalogos de Administracion, no los de Almacen", async () => {
    setMockSessionUser(createMockAuthUser({ permissions: ["*"] }));
    server.use(
      http.get(getApiUrl("navigation-menu"), () =>
        HttpResponse.json({
          source: "db",
          // Orden deliberado: "Almacen" (con su propio nodo "Catalogos")
          // aparece ANTES que "Administracion" en la respuesta -- si la
          // busqueda no estuviera acotada al subarbol de Administracion,
          // este orden agarraria el nodo equivocado.
          sections: [
            {
              title: "Almacén",
              permissions: [],
              items: [
                {
                  title: "Catálogos",
                  icon: "book-open",
                  url: null,
                  badge: null,
                  permissions: [],
                  items: [
                    {
                      title: "Insumos",
                      icon: null,
                      url: "/almacen/insumos",
                      badge: null,
                      permissions: [],
                    },
                    {
                      title: "Proveedores",
                      icon: null,
                      url: "/almacen/proveedores",
                      badge: null,
                      permissions: [],
                    },
                  ],
                },
              ],
            },
            {
              title: "Administracion",
              permissions: [],
              items: [
                {
                  title: "Panel",
                  icon: null,
                  url: null,
                  badge: null,
                  permissions: [],
                  items: [],
                },
                {
                  title: "Catalogos",
                  icon: "book-open",
                  url: null,
                  badge: null,
                  permissions: [],
                  items: [
                    {
                      title: "Areas",
                      icon: null,
                      url: "/admin/catalogos/areas",
                      badge: null,
                      permissions: [],
                    },
                    {
                      title: "Bajas",
                      icon: null,
                      url: "/admin/catalogos/bajas",
                      badge: null,
                      permissions: [],
                    },
                  ],
                },
              ],
            },
          ],
          secondaryItems: [],
        }),
      ),
    );

    render(<CatalogosHubPage />);

    expect(await screen.findByText("Areas")).toBeInTheDocument();
    expect(screen.getByText("Bajas")).toBeInTheDocument();
    expect(screen.queryByText("Insumos")).not.toBeInTheDocument();
    expect(screen.queryByText("Proveedores")).not.toBeInTheDocument();
  });
});
