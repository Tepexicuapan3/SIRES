import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const FRONTEND_SRC_ROOT = path.resolve(process.cwd(), "src");
const GUARDED_DIRECTORIES = [
  "test/e2e",
  "test/integration/contracts",
  "test/bun",
] as const;
const IGNORED_FILES = new Set([
  "test/unit/architecture/ts-anti-bypass-guard.spec.ts",
]);
const SOURCE_FILE_EXTENSIONS = new Set([".ts", ".tsx"]);

const BYPASS_PATTERNS = {
  DOUBLE_CAST: /as\s+unknown\s+as/g,
  TS_IGNORE: /@ts-ignore|@ts-nocheck/g,
  EXPLICIT_ANY: /:\s*any\b|as\s+any\b|<any>/g,
} as const;

const collectSourceFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
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

  return nestedFiles.flat();
};

describe("TypeScript anti-bypass guard", () => {
  it("blocks any/as unknown as/@ts-ignore in guarded test frontiers", async () => {
    const filesByDirectory = await Promise.all(
      GUARDED_DIRECTORIES.map((relativeDir) =>
        collectSourceFiles(path.resolve(FRONTEND_SRC_ROOT, relativeDir)),
      ),
    );
    const files = filesByDirectory.flat();
    const offenders: string[] = [];

    for (const filePath of files) {
      const relativePath = path.relative(FRONTEND_SRC_ROOT, filePath);

      if (IGNORED_FILES.has(relativePath)) {
        continue;
      }

      const content = await readFile(filePath, "utf-8");

      for (const [patternName, pattern] of Object.entries(BYPASS_PATTERNS)) {
        pattern.lastIndex = 0;

        if (pattern.test(content)) {
          offenders.push(`${relativePath} -> ${patternName}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
