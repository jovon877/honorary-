import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { assetManifestSchema, checkAssetBudget } from "../packages/sim-assets/src/index.js";
import { walkFiles } from "./walk.js";

const errors: string[] = [];
const files = await walkFiles(resolve("tests/fixtures"));
const manifests = files.filter((file) => file.endsWith(".asset-manifest.json"));
for (const file of manifests) {
  const manifest = assetManifestSchema.parse(JSON.parse(await readFile(file, "utf8")));
  errors.push(...checkAssetBudget(manifest).map((error) => `${manifest.id}: ${error}`));
}

const dist = resolve("apps/sim-player/dist");
try {
  const outputFiles = await walkFiles(dist);
  let bytes = 0;
  for (const file of outputFiles) bytes += (await stat(file)).size;
  if (bytes > 15 * 1024 * 1024)
    errors.push(`built initial payload is ${(bytes / 1024 / 1024).toFixed(2)} MB`);
} catch {
  // The manifest budget is the pre-build dry run; built bytes are checked after a build exists.
}

if (errors.length > 0) throw new Error(errors.join("\n"));
console.log(`sim:budgets passed — ${manifests.length} manifest(s).`);
