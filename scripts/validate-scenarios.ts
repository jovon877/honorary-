import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { scenarioSchema, validateObjectiveMapping } from "../packages/sim-content/src/index.js";
import { walkFiles } from "./walk.js";

const scenarioRoot = resolve("content/scenarios");
try {
  await access(scenarioRoot);
} catch {
  console.log("sim:validate passed — M0 contains no scenarios.");
  process.exit(0);
}

const files = (await walkFiles(scenarioRoot)).filter((file) => file.endsWith(".json"));
const errors: string[] = [];
for (const file of files) {
  const result = scenarioSchema.safeParse(JSON.parse(await readFile(file, "utf8")));
  if (!result.success) {
    errors.push(`${file}: ${result.error.message}`);
    continue;
  }
  if (
    !result.data.accessibility.keyboardPath ||
    result.data.accessibility.non3dSteps.length === 0
  ) {
    errors.push(`${file}: missing equivalent non-3D path`);
  }
  const knownObjectives = new Set(result.data.objectiveIds);
  errors.push(
    ...validateObjectiveMapping(result.data, knownObjectives).map((error) => `${file}: ${error}`),
  );
}
if (errors.length > 0) throw new Error(errors.join("\n"));
console.log(`sim:validate passed — ${files.length} scenario file(s).`);
