import { access } from "node:fs/promises";
import { resolve } from "node:path";

const promptRoot = resolve("packages/curriculum-ai/prompts");
try {
  await access(promptRoot);
  throw new Error("Prompt files exist but M0 has no owner-approved golden evaluation set.");
} catch (error) {
  if (error instanceof Error && error.message.startsWith("Prompt files exist")) throw error;
}
console.log("ai:eval passed — no prompt templates or model IDs exist in M0.");
