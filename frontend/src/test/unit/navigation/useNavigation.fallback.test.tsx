import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@/test/utils";
import { TestProviders } from "@/test/providers";
import { useNavigation } from "@features/navigation/hooks/useNavigation";
import { NAV_CONFIG, NAV_SECONDARY } from "@app/navigation/nav-config";
import { server } from "@/test/mocks/server";
import { getApiUrl } from "@/test/mocks/urls";
import { setMockSessionUser } from "@/test/mocks/session";
import { createMockAuthUser } from "@/test/factories/users";

/**
 * `useNavigation` MUST nunca dejar el sidebar vacio: ante loading, error,
 * `source !== "db"` (flag OFF) o arbol vacio, cae a `NAV_CONFIG` local.
 * Con un usuario admin (`permissions: ["*"]`), `filterNavigation` no
 * descarta nada, asi que el fallback debe coincidir exactamente con
 * `NAV_CONFIG`/`NAV_SECONDARY` (misma estructura, mismos nodos).
 */
describe("useNavigation - fallback", () => {
  it("sirve NAV_CONFIG cuando el backend responde source:db pero sections vacio", async () => {
    setMockSessionUser(createMockAuthUser({ permissions: ["*"] }));
    server.use(
      http.get(getApiUrl("navigation-menu"), () =>
        HttpResponse.json({ source: "db", sections: [], secondaryItems: [] }),
      ),
    );

    const { result } = renderHook(() => useNavigation(), {
      wrapper: TestProviders,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFallback).toBe(true);
    expect(result.current.isEmpty).toBe(false);
    expect(result.current.sections).toEqual(NAV_CONFIG);
    expect(result.current.secondaryItems).toEqual(NAV_SECONDARY);
  });

  it("cae a NAV_CONFIG cuando el flag backend esta OFF (source: static)", async () => {
    setMockSessionUser(createMockAuthUser({ permissions: ["*"] }));
    server.use(
      http.get(getApiUrl("navigation-menu"), () =>
        HttpResponse.json({
          source: "static",
          sections: [],
          secondaryItems: [],
        }),
      ),
    );

    const { result } = renderHook(() => useNavigation(), {
      wrapper: TestProviders,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFallback).toBe(true);
    expect(result.current.sections).toEqual(NAV_CONFIG);
    expect(result.current.secondaryItems).toEqual(NAV_SECONDARY);
  });

  it("cae a NAV_CONFIG ante error del endpoint (500)", async () => {
    setMockSessionUser(createMockAuthUser({ permissions: ["*"] }));
    server.use(
      http.get(getApiUrl("navigation-menu"), () =>
        HttpResponse.json(
          { code: "INTERNAL_SERVER_ERROR", message: "Error" },
          { status: 500 },
        ),
      ),
    );

    const { result } = renderHook(() => useNavigation(), {
      wrapper: TestProviders,
    });

    await waitFor(
      () => {
        expect(result.current.isFallback).toBe(true);
      },
      { timeout: 5000 },
    );

    expect(result.current.isEmpty).toBe(false);
    expect(result.current.sections).toEqual(NAV_CONFIG);
  });

  it("usa el arbol del backend cuando source es db y sections no viene vacio", async () => {
    setMockSessionUser(createMockAuthUser({ permissions: ["*"] }));
    server.use(
      http.get(getApiUrl("navigation-menu"), () =>
        HttpResponse.json({
          source: "db",
          sections: [
            {
              title: "Seccion Custom",
              permissions: [],
              items: [
                {
                  title: "Item Custom",
                  icon: null,
                  url: "/custom",
                  badge: null,
                  permissions: [],
                },
              ],
            },
          ],
          secondaryItems: [],
        }),
      ),
    );

    const { result } = renderHook(() => useNavigation(), {
      wrapper: TestProviders,
    });

    await waitFor(() => {
      expect(result.current.isFallback).toBe(false);
    });

    expect(result.current.sections).toEqual([
      {
        title: "Seccion Custom",
        permissions: [],
        items: [
          {
            title: "Item Custom",
            url: "/custom",
            permissions: [],
          },
        ],
      },
    ]);
  });
});
