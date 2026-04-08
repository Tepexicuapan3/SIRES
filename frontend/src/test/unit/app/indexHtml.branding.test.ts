import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("index.html branding", () => {
  it("uses SISEM as document title", () => {
    const indexHtml = readFileSync(
      resolve(process.cwd(), "index.html"),
      "utf-8",
    );

    expect(indexHtml).toContain("<title>SISEM</title>");
  });
});
