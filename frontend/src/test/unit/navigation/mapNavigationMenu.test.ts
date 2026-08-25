import { describe, expect, it } from "vitest";
import {
  DEFAULT_NAV_ICON,
  NAV_ICONS,
  resolveNavIcon,
} from "@app/navigation/nav-icons";
import { mapNavigationMenu } from "@features/navigation/domain/mapNavigationMenu";
import type { NavigationMenuResponse } from "@api/types/navigation.types";

describe("resolveNavIcon", () => {
  it("resuelve un nombre conocido al componente Lucide correspondiente", () => {
    expect(resolveNavIcon("shield-user")).toBe(NAV_ICONS["shield-user"]);
    expect(resolveNavIcon("book-open")).toBe(NAV_ICONS["book-open"]);
  });

  it("cae al icono default ante un nombre desconocido", () => {
    expect(resolveNavIcon("icono-que-no-existe")).toBe(DEFAULT_NAV_ICON);
  });

  it("cae al icono default ante null/undefined", () => {
    expect(resolveNavIcon(null)).toBe(DEFAULT_NAV_ICON);
    expect(resolveNavIcon(undefined)).toBe(DEFAULT_NAV_ICON);
  });
});

describe("mapNavigationMenu", () => {
  it("mapea secciones e items anidados preservando titulo/url/badge/permissions", () => {
    const response: NavigationMenuResponse = {
      source: "db",
      sections: [
        {
          title: "Administracion",
          icon: null,
          permissions: [],
          items: [
            {
              title: "Panel",
              icon: "shield-user",
              url: null,
              badge: null,
              permissions: [],
              items: [
                {
                  title: "Usuarios",
                  icon: null,
                  url: "/admin/usuarios",
                  badge: null,
                  permissions: ["admin:gestion:usuarios:read"],
                },
              ],
            },
          ],
        },
      ],
      secondaryItems: [
        {
          title: "Soporte",
          icon: "shield",
          url: "/soporte",
          badge: null,
          permissions: [],
        },
      ],
    };

    const mapped = mapNavigationMenu(response);

    expect(mapped.sections).toEqual([
      {
        title: "Administracion",
        permissions: [],
        items: [
          {
            title: "Panel",
            icon: NAV_ICONS["shield-user"],
            permissions: [],
            items: [
              {
                title: "Usuarios",
                url: "/admin/usuarios",
                permissions: ["admin:gestion:usuarios:read"],
              },
            ],
          },
        ],
      },
    ]);

    expect(mapped.secondaryItems).toEqual([
      {
        title: "Soporte",
        icon: NAV_ICONS.shield,
        url: "/soporte",
        permissions: [],
      },
    ]);
  });

  it("no asigna icono cuando el DTO trae icon:null (preserva parity con nodos sin icono)", () => {
    const response: NavigationMenuResponse = {
      source: "db",
      sections: [
        {
          title: "Clinico",
          icon: null,
          permissions: [],
          items: [
            {
              title: "Somatometria",
              icon: null,
              url: "/clinico/somatometria",
              badge: null,
              permissions: [],
            },
          ],
        },
      ],
      secondaryItems: [],
    };

    const mapped = mapNavigationMenu(response);

    expect(mapped.sections[0]!.items[0]!.icon).toBeUndefined();
  });

  it("resuelve al icono default cuando el DTO trae un icon desconocido", () => {
    const response: NavigationMenuResponse = {
      source: "db",
      sections: [
        {
          title: "Farmacia",
          icon: null,
          permissions: [],
          items: [
            {
              title: "Modulo nuevo",
              icon: "un-icono-que-no-existe-en-el-mapa",
              url: "/farmacia/nuevo",
              badge: null,
              permissions: [],
            },
          ],
        },
      ],
      secondaryItems: [],
    };

    const mapped = mapNavigationMenu(response);

    expect(mapped.sections[0]!.items[0]!.icon).toBe(DEFAULT_NAV_ICON);
  });

  it("omite badge/url cuando el DTO los trae null y omite items cuando vienen vacios", () => {
    const response: NavigationMenuResponse = {
      source: "db",
      sections: [
        {
          title: "Seccion",
          icon: null,
          permissions: [],
          items: [
            {
              title: "Sin badge ni url",
              icon: null,
              url: null,
              badge: null,
              permissions: [],
              items: [],
            },
          ],
        },
      ],
      secondaryItems: [],
    };

    const mapped = mapNavigationMenu(response);
    const item = mapped.sections[0]!.items[0]!;

    expect(item.url).toBeUndefined();
    expect(item.badge).toBeUndefined();
    expect(item.items).toBeUndefined();
  });
});
