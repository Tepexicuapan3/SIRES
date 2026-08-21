import { describe, expect, it } from "vitest";
import {
  buildNavIconOptions,
  NAV_ICONS,
  NAV_ICON_LABELS,
} from "@app/navigation/nav-icons";

/**
 * Anti-drift de `NAV_ICONS` (Fase 6.3).
 *
 * Razon industria:
 * - `NavIconPicker` es la UNICA superficie donde un admin elige un icono
 *   (grid visual, nunca texto libre kebab-case). Si alguien agrega un
 *   icono a `NAV_ICONS` y se olvida de que el picker lo derive, o si el
 *   picker algun dia hardcodea/filtra una lista distinta, un admin
 *   quedaria sin poder elegir un icono que SI existe en el catalogo (o el
 *   picker ofreceria uno que `resolveNavIcon` no sabe resolver). Este test
 *   compara el conjunto de opciones que arma el picker contra
 *   `Object.keys(NAV_ICONS)` -- deben coincidir EXACTAMENTE.
 * - El segundo test cubre el mismo invariante que `menu-destinations.test.ts`
 *   aplica a los labels de destinos: TODA clave de `NAV_ICONS` debe tener
 *   su nombre humano en `NAV_ICON_LABELS`, sin huerfanos de ningun lado.
 */
describe("nav-icons.ts (anti-drift)", () => {
  it("las opciones del NavIconPicker coinciden EXACTAMENTE con Object.keys(NAV_ICONS)", () => {
    const pickerNames = buildNavIconOptions()
      .map((option) => option.name)
      .sort();
    const catalogNames = Object.keys(NAV_ICONS).sort();

    expect(pickerNames).toEqual(catalogNames);
  });

  it("toda clave de NAV_ICONS tiene su label humano en NAV_ICON_LABELS", () => {
    const missing = Object.keys(NAV_ICONS).filter(
      (name) => !(name in NAV_ICON_LABELS),
    );

    expect(missing, `Faltan labels para: ${missing.join(", ")}`).toEqual([]);
  });

  it("no quedan labels huerfanos de iconos que ya no existen en NAV_ICONS", () => {
    const orphaned = Object.keys(NAV_ICON_LABELS).filter(
      (name) => !(name in NAV_ICONS),
    );

    expect(
      orphaned,
      `Labels huerfanos (icono ya no existe): ${orphaned.join(", ")}`,
    ).toEqual([]);
  });

  it("el picker no ofrece iconos duplicados", () => {
    const names = buildNavIconOptions().map((option) => option.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
