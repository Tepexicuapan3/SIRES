import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const targetFile = resolve(
  process.cwd(),
  "node_modules/vite/dist/node/chunks/config.js",
);

if (!existsSync(targetFile)) {
  process.exit(0);
}

const source = readFileSync(targetFile, "utf8");
const destroySoonCall = "socket.destroySoon();";
const fallbackCall =
  'if (typeof socket.destroySoon === "function") socket.destroySoon();\n\t\t\telse if (typeof socket.destroy === "function") socket.destroy();';

if (!source.includes(destroySoonCall) || source.includes(fallbackCall)) {
  process.exit(0);
}

const patched = source.replaceAll(destroySoonCall, fallbackCall);
writeFileSync(targetFile, patched, "utf8");
