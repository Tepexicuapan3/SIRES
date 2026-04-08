import { describe, expect, it } from "vitest";

describe("sidebar imports", () => {
  it("resuelve el barrel de sidebar sin errores de módulo", async () => {
    const sidebarModule = await import("@shared/layouts/sidebar");

    expect(sidebarModule.AppSidebar).toBeDefined();
    expect(sidebarModule.NavMain).toBeDefined();
    expect(sidebarModule.NavSecondary).toBeDefined();
    expect(sidebarModule.NavUser).toBeDefined();
  });
});
