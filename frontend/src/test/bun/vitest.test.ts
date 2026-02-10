import { test, expect } from "bun:test";
import { fileURLToPath } from "url";

const projectRoot = fileURLToPath(new URL("../../../", import.meta.url));

test("vitest suite passes", async () => {
  const process = Bun.spawn({
    cmd: ["bun", "run", "test", "--run"],
    cwd: projectRoot,
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await process.exited;
  expect(exitCode).toBe(0);
}, 120000);
