import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { render, waitFor } from "@/test/utils";
import { SidebarBreadcrumbs } from "@shared/layouts/header/SidebarBreadcrumbs";
import { ModuleSearch } from "@shared/layouts/header/ModuleSearch";
import { useNavigation } from "@features/navigation/hooks/useNavigation";
import { server } from "@/test/mocks/server";
import { getApiUrl } from "@/test/mocks/urls";
import { setMockSessionUser } from "@/test/mocks/session";
import { createMockAuthUser } from "@/test/factories/users";

/** Standin del sidebar: solo necesitamos otro consumidor de useNavigation
 * montado en paralelo, sin arrastrar todo AppSidebar (Sidebar UI/Zustand). */
const SidebarProbe = () => {
  const { isEmpty } = useNavigation();
  return <div data-testid="sidebar-probe">{isEmpty ? "empty" : "ready"}</div>;
};

describe("navigation query dedupe", () => {
  it("SidebarBreadcrumbs + ModuleSearch + sidebar comparten queryKey -> un solo fetch", async () => {
    let fetchCount = 0;
    server.use(
      http.get(getApiUrl("navigation-menu"), () => {
        fetchCount += 1;
        return HttpResponse.json({
          source: "db",
          sections: [
            {
              title: "Administracion",
              permissions: [],
              items: [
                {
                  title: "Usuarios",
                  icon: null,
                  url: "/admin/usuarios",
                  badge: null,
                  permissions: [],
                },
              ],
            },
          ],
          secondaryItems: [],
        });
      }),
    );
    setMockSessionUser(createMockAuthUser({ permissions: ["*"] }));

    const { getByTestId } = render(
      <>
        <SidebarProbe />
        <SidebarBreadcrumbs />
        <ModuleSearch />
      </>,
    );

    await waitFor(
      () => {
        expect(getByTestId("sidebar-probe").textContent).toBe("ready");
      },
      { timeout: 3000 },
    );

    expect(fetchCount).toBe(1);
  });
});
