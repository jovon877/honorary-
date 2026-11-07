import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm --filter @honorary-homes/sim-player preview --host 127.0.0.1",
    port: 4173,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "chromium-software-webgl",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        launchOptions: {
          args: [
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
            "--disable-crash-reporter",
            "--disable-crashpad",
            `--crash-dumps-dir=${resolve(".cache/chromium-crashes")}`,
          ],
        },
      },
    },
  ],
});
