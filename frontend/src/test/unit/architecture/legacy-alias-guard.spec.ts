import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const LEGACY_ALIAS_PATTERN =
  /(?:from\s+["']|import\s*\(\s*["'])@\/(api|routes|realtime|components|config|providers|store|styles|hooks)\b/g;

const SOURCE_ROOT = path.resolve(process.cwd(), "src");
const SOURCE_FILE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts"]);

const collectSourceFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectSourceFiles(fullPath);
      }

      if (SOURCE_FILE_EXTENSIONS.has(path.extname(entry.name))) {
        return [fullPath];
      }

      return [];
    }),
  );

  return nested.flat();
};

describe("Legacy alias guard", () => {
  it("bloquea reintroducción de aliases legacy @/(api|routes|...)", async () => {
    const files = await collectSourceFiles(SOURCE_ROOT);
    const offenders: string[] = [];

    for (const filePath of files) {
      const content = await readFile(filePath, "utf-8");
      LEGACY_ALIAS_PATTERN.lastIndex = 0;

      if (LEGACY_ALIAS_PATTERN.test(content)) {
        offenders.push(path.relative(SOURCE_ROOT, filePath));
      }
    }

    expect(offenders).toEqual([]);
  });
});
