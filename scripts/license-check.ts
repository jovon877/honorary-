import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

type Tree = "prod" | "dev";
interface PnpmLicensePackage {
  name: string;
  versions: string[];
  license: string;
}
type PnpmLicenseReport = Record<string, PnpmLicensePackage[]>;

interface ExceptionRecord {
  packageName: string;
  version: string;
  license: string;
  tree: string;
  reviewDate: string;
}

const allowed = new Set([
  "MIT",
  "MIT-0",
  "ISC",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "Apache-2.0",
  "0BSD",
  "BlueOak-1.0.0",
  "CC0-1.0",
  "Unlicense",
  "Python-2.0",
]);
const devOnly = new Set(["MPL-2.0", "CC-BY-4.0", "CC-BY-3.0"]);
const mode = process.argv[2];
if (mode !== "--prod" && mode !== "--dev") throw new Error("Use --prod or --dev");
const tree: Tree = mode === "--prod" ? "prod" : "dev";

function options(expression: string): string[][] {
  const normalized = expression.replace(/[()]/g, "").trim();
  if (!normalized) return [];
  return normalized
    .split(/\s+OR\s+/i)
    .map((choice) => choice.split(/\s+AND\s+/i).map((license) => license.trim()));
}

function isAllowed(expression: string, target: Tree): boolean {
  const accepted = target === "dev" ? new Set([...allowed, ...devOnly]) : allowed;
  return options(expression).some(
    (choice) => choice.length > 0 && choice.every((license) => accepted.has(license)),
  );
}

async function readExceptions(): Promise<ExceptionRecord[]> {
  const text = await readFile(resolve("docs/security/license-exceptions.md"), "utf8");
  return text
    .split("\n")
    .filter((line) => line.startsWith("|") && !line.includes("---") && !line.includes("Package |"))
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim()),
    )
    .filter((cells) => cells.length === 8 && cells.every(Boolean))
    .map((cells) => ({
      packageName: cells[0]!,
      version: cells[1]!,
      license: cells[2]!,
      tree: cells[3]!,
      reviewDate: cells[7]!,
    }));
}

function hasCurrentException(
  records: readonly ExceptionRecord[],
  item: PnpmLicensePackage,
  version: string,
  target: Tree,
): boolean {
  return records.some((record) => {
    const reviewDate = new Date(`${record.reviewDate}T23:59:59Z`);
    return (
      record.packageName === item.name &&
      record.version === version &&
      record.license === item.license &&
      (record.tree === target || record.tree === "both") &&
      Number.isFinite(reviewDate.valueOf()) &&
      reviewDate >= new Date()
    );
  });
}

async function assertFirstPartyPackages(): Promise<void> {
  const roots = [resolve("apps"), resolve("packages"), resolve("workers")];
  const errors: string[] = [];
  for (const root of roots) {
    for (const entry of await readdir(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const data = JSON.parse(await readFile(join(root, entry.name, "package.json"), "utf8")) as {
        name?: string;
        private?: boolean;
        license?: string;
      };
      if (!data.name?.startsWith("@honorary-homes/")) continue;
      if (data.private !== true || data.license !== "UNLICENSED") {
        errors.push(
          `${data.name}: first-party packages require private=true and license=UNLICENSED`,
        );
      }
    }
  }
  if (errors.length > 0) throw new Error(errors.join("\n"));
}

function loadReport(target: Tree): PnpmLicenseReport {
  const pnpm = process.env.npm_execpath ?? "pnpm";
  const args =
    target === "prod"
      ? ["--filter", "./apps/*", "--filter", "./workers/*", "licenses", "list", "--prod", "--json"]
      : ["licenses", "list", "--json"];
  const output = execFileSync(pnpm, args, {
    encoding: "utf8",
    env: { ...process.env, NO_UPDATE_NOTIFIER: "1" },
    maxBuffer: 10 * 1024 * 1024,
  });
  return JSON.parse(output) as PnpmLicenseReport;
}

await assertFirstPartyPackages();
const exceptions = await readExceptions();
const report = loadReport(tree);
const notices = await readFile(resolve("THIRD_PARTY_NOTICES.md"), "utf8");
const failures: string[] = [];
let checked = 0;

for (const packages of Object.values(report)) {
  for (const item of packages) {
    for (const version of item.versions) {
      checked += 1;
      if (item.name.startsWith("@honorary-homes/")) continue;
      if (!isAllowed(item.license, tree) && !hasCurrentException(exceptions, item, version, tree)) {
        failures.push(`${item.name}@${version}: ${item.license}`);
        continue;
      }
      const usesDevOnlyLicense =
        tree === "dev" && !isAllowed(item.license, "prod") && isAllowed(item.license, "dev");
      if (
        usesDevOnlyLicense &&
        (!notices.includes(`\`${item.name}\``) || !notices.includes(version))
      ) {
        failures.push(`${item.name}@${version}: missing THIRD_PARTY_NOTICES.md attribution`);
      }
    }
  }
}

if (failures.length > 0) {
  throw new Error(
    `Blocked, unknown, or unattributed licenses in ${tree} tree:\n${failures.sort().join("\n")}`,
  );
}
console.log(`deps:licenses:${tree} passed — ${checked} package versions checked.`);
