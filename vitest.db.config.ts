import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    include: [
      "tests/backend/db-contract.integration.test.ts",
      "tests/backend/m0-5-controls.integration.test.ts",
      "tests/backend/reference-db.integration.test.ts",
    ],
  },
});
