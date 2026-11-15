// The map engine runs part of itself in a web worker loaded from its own
// file. The bundler does not serve that file, so it is copied into `public/`
// after every install and the app points the engine at it.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs");
const to = join(root, "public/vendor/maplibre-gl-worker.mjs");

mkdirSync(dirname(to), { recursive: true });
copyFileSync(from, to);
console.log("Copied the map worker to public/vendor/");
